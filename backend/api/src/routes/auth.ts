import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { randomToken, sha256Hex } from '../lib/hash.js'
import { signAccessToken } from '../lib/jwt.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/mailer.js'

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
})

const loginSchema = registerSchema

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
})

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
})

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
})

const verifyEmailSchema = z.object({
  token: z.string().min(10),
})

export function authRouter(env: Env) {
  const r = Router()

  r.post('/register', async (req, res, next) => {
    try {
      const body = registerSchema.parse(req.body)
      const exists = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
      if (exists) {
        throw new HttpError(409, 'El correo ya está registrado', 'EMAIL_IN_USE')
      }
      const passwordHash = await hashPassword(body.password)
      const user = await prisma.user.create({
        data: { email: body.email.toLowerCase(), passwordHash },
      })
      // No bloquea el registro si el mailer (stub o real) fallara — la
      // cuenta ya existe y es usable; el usuario puede pedir el reenvío
      // con POST /auth/resend-verification.
      await issueEmailVerificationToken(env, user.id, user.email).catch((err: unknown) =>
        console.error('No se pudo enviar el email de verificación', err),
      )
      const tokens = await issueTokens(env, user.id, user.email)
      return res.status(201).json(tokens)
    } catch (e) {
      next(e)
    }
  })

  r.post('/login', async (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body)
      const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
      if (!user) {
        throw new HttpError(401, 'Credenciales incorrectas', 'INVALID_CREDENTIALS')
      }
      const ok = await verifyPassword(body.password, user.passwordHash)
      if (!ok) {
        throw new HttpError(401, 'Credenciales incorrectas', 'INVALID_CREDENTIALS')
      }
      const tokens = await issueTokens(env, user.id, user.email)
      return res.json(tokens)
    } catch (e) {
      next(e)
    }
  })

  r.post('/refresh', async (req, res, next) => {
    try {
      const body = refreshSchema.parse(req.body)
      const tokenHash = sha256Hex(body.refreshToken)
      const record = await prisma.refreshToken.findUnique({ where: { tokenHash } })
      if (!record || record.expiresAt < new Date()) {
        throw new HttpError(401, 'Refresh token inválido o expirado', 'INVALID_REFRESH_TOKEN')
      }
      const user = await prisma.user.findUnique({ where: { id: record.userId } })
      if (!user) {
        throw new HttpError(401, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }
      await prisma.refreshToken.delete({ where: { id: record.id } })
      const tokens = await issueTokens(env, user.id, user.email)
      return res.json(tokens)
    } catch (e) {
      next(e)
    }
  })

  r.post('/logout', requireAuth(env), async (req, res, next) => {
    try {
      const userId = req.userId!
      await prisma.refreshToken.deleteMany({ where: { userId } })
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  r.get('/me', requireAuth(env), async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: { id: true, email: true, createdAt: true, emailVerifiedAt: true },
      })
      if (!user) {
        throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }
      return res.json(user)
    } catch (e) {
      next(e)
    }
  })

  r.post('/forgot-password', async (req, res, next) => {
    try {
      const body = forgotPasswordSchema.parse(req.body)
      const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
      // Misma respuesta exista o no el email: filtrar "no existe" acá
      // permitiría enumerar cuentas registradas probando direcciones.
      if (user) {
        // Invalida cualquier link de reset previo sin usar — solo el más
        // reciente debe funcionar.
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
        const plain = randomToken(32)
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + env.PASSWORD_RESET_TOKEN_TTL_MIN)
        await prisma.passwordResetToken.create({
          data: { tokenHash: sha256Hex(plain), userId: user.id, expiresAt },
        })
        await sendPasswordResetEmail(user.email, plain)
      }
      return res.status(202).json({
        message: 'Si el correo existe, vas a recibir un link para restablecer tu contraseña.',
      })
    } catch (e) {
      next(e)
    }
  })

  r.post('/reset-password', async (req, res, next) => {
    try {
      const body = resetPasswordSchema.parse(req.body)
      const tokenHash = sha256Hex(body.token)
      const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
      if (!record || record.expiresAt < new Date()) {
        throw new HttpError(400, 'El link de recuperación es inválido o expiró', 'INVALID_RESET_TOKEN')
      }
      const passwordHash = await hashPassword(body.password)
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash, passwordChangedAt: new Date() },
        }),
        // Cambiar la contraseña cierra sesión en todos lados: si alguien más
        // tenía un refresh token vigente (robado o de un dispositivo
        // perdido), este era justo el escenario que un reset de contraseña
        // tiene que resolver.
        prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
        prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
      ])
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  r.post('/verify-email', async (req, res, next) => {
    try {
      const body = verifyEmailSchema.parse(req.body)
      const tokenHash = sha256Hex(body.token)
      const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } })
      if (!record || record.expiresAt < new Date()) {
        throw new HttpError(
          400,
          'El link de verificación es inválido o expiró',
          'INVALID_VERIFICATION_TOKEN',
        )
      }
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerifiedAt: new Date() },
        }),
        prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
      ])
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  r.post('/resend-verification', requireAuth(env), async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId! } })
      if (!user) {
        throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }
      if (user.emailVerifiedAt) {
        throw new HttpError(400, 'El correo ya está verificado', 'EMAIL_ALREADY_VERIFIED')
      }
      await issueEmailVerificationToken(env, user.id, user.email)
      return res.status(202).json({ message: 'Te reenviamos el link de verificación.' })
    } catch (e) {
      next(e)
    }
  })

  return r
}

async function issueEmailVerificationToken(env: Env, userId: string, email: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })
  const plain = randomToken(32)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS)
  await prisma.emailVerificationToken.create({
    data: { tokenHash: sha256Hex(plain), userId, expiresAt },
  })
  await sendVerificationEmail(email, plain)
}

async function issueTokens(env: Env, userId: string, email: string) {
  const refreshPlain = randomToken(48)
  const tokenHash = sha256Hex(refreshPlain)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS)

  // Cubre register/login/refresh (las tres rutas pasan por acá): "última
  // actividad" para el panel admin no necesita distinguir cuál de las tres
  // fue — ver comentario de lastLoginAt en schema.prisma.
  await Promise.all([
    prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } }),
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
  ])

  const access = signAccessToken(env, { id: userId, email })
  return {
    accessToken: access.token,
    refreshToken: refreshPlain,
    tokenType: 'Bearer',
    expiresIn: access.expiresInSec,
  }
}
