import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { randomToken, sha256Hex } from '../lib/hash.js'
import { signAccessToken } from '../lib/jwt.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres')
    .max(128)
    .regex(/[a-z]/, 'La contraseña debe incluir una letra minúscula')
    .regex(/[A-Z]/, 'La contraseña debe incluir una letra mayúscula')
    .regex(/\d/, 'La contraseña debe incluir al menos un número'),
})

const loginSchema = registerSchema

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
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
        select: { id: true, email: true, createdAt: true },
      })
      if (!user) {
        throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }
      return res.json(user)
    } catch (e) {
      next(e)
    }
  })

  return r
}

async function issueTokens(env: Env, userId: string, email: string) {
  const refreshPlain = randomToken(48)
  const tokenHash = sha256Hex(refreshPlain)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS)

  await prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  })

  const access = signAccessToken(env, { id: userId, email })
  return {
    accessToken: access.token,
    refreshToken: refreshPlain,
    tokenType: 'Bearer',
    expiresIn: access.expiresInSec,
  }
}
