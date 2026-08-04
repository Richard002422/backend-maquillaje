import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { profileUserSelect, toCustomerProfileResponse } from '../lib/customerProfileMapper.js'
import { hashPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'
import {
  isCustomerProfileComplete,
  upsertCustomerProfileSchema,
} from '../models/customerProfile.js'
import { requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'

const patchBeautySchema = z.object({
  skinTone: z.string().trim().min(1).max(40).optional(),
  skinType: z.string().trim().min(1).max(40).optional(),
  preferredStyles: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
})

export function usersRouter(env: Env) {
  const r = Router()
  r.use(requireAuth(env))

  r.get('/me/profile', async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: profileUserSelect,
      })
      if (!user) {
        throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }
      return res.json(toCustomerProfileResponse(user))
    } catch (e) {
      next(e)
    }
  })

  r.put('/me/profile', async (req, res, next) => {
    try {
      const body = upsertCustomerProfileSchema.parse(req.body)
      const userId = req.userId!

      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: profileUserSelect,
      })
      if (!existing) {
        throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }

      const emailLower = body.email.toLowerCase()
      if (emailLower !== existing.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email: emailLower } })
        if (emailTaken && emailTaken.id !== userId) {
          throw new HttpError(409, 'El correo ya está en uso', 'EMAIL_IN_USE')
        }
      }

      const now = new Date()
      const acceptsTermsAt = body.acceptsTerms ? now : null

      const profileComplete = isCustomerProfileComplete({
        firstName: body.firstName,
        lastName: body.lastName,
        email: emailLower,
        phone: body.phone,
        addressLine: body.addressLine,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country,
        acceptsTerms: body.acceptsTerms,
        hasPassword: Boolean(body.password || existing.passwordHash),
      })

      const userData: {
        email: string
        firstName: string
        lastName: string
        phone: string
        passwordHash?: string
        passwordChangedAt?: Date
      } = {
        email: emailLower,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
      }

      if (body.password) {
        userData.passwordHash = await hashPassword(body.password)
        userData.passwordChangedAt = now
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userData,
          customerProfile: {
            upsert: {
              create: {
                addressLine: body.addressLine,
                city: body.city,
                postalCode: body.postalCode,
                country: body.country,
                acceptsTerms: body.acceptsTerms,
                acceptsTermsAt,
                termsVersion: body.termsVersion,
                completedAt: profileComplete ? now : null,
              },
              update: {
                addressLine: body.addressLine,
                city: body.city,
                postalCode: body.postalCode,
                country: body.country,
                acceptsTerms: body.acceptsTerms,
                acceptsTermsAt: body.acceptsTerms ? acceptsTermsAt : null,
                termsVersion: body.termsVersion,
                completedAt: profileComplete ? now : null,
              },
            },
          },
        },
        select: profileUserSelect,
      })

      return res.json(toCustomerProfileResponse(user))
    } catch (e) {
      next(e)
    }
  })

  r.patch('/me/profile', async (req, res, next) => {
    try {
      const body = patchBeautySchema.parse(req.body)
      if (Object.keys(body).length === 0) {
        throw new HttpError(400, 'Debes enviar al menos un campo a actualizar', 'VALIDATION_ERROR')
      }
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: {
          skinTone: body.skinTone,
          skinType: body.skinType,
          preferredStyles: body.preferredStyles,
        },
        select: profileUserSelect,
      })
      return res.json(toCustomerProfileResponse(user))
    } catch (e) {
      next(e)
    }
  })

  r.get('/me/activity', async (req, res, next) => {
    try {
      const [recommendations, tryOns, refreshTokens] = await Promise.all([
        prisma.recommendation.count({ where: { userId: req.userId! } }),
        prisma.makeupTryOnSession.count({ where: { userId: req.userId! } }),
        prisma.refreshToken.count({ where: { userId: req.userId! } }),
      ])
      return res.json({
        userId: req.userId,
        counters: { recommendations, tryOns, activeRefreshTokens: refreshTokens },
      })
    } catch (e) {
      next(e)
    }
  })

  return r
}
