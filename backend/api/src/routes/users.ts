import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
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
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          skinTone: true,
          skinType: true,
          preferredStyles: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      if (!user) {
        throw new HttpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND')
      }
      return res.json(user)
    } catch (e) {
      next(e)
    }
  })

  r.patch('/me/profile', async (req, res, next) => {
    try {
      const body = updateProfileSchema.parse(req.body)
      if (Object.keys(body).length === 0) {
        throw new HttpError(400, 'Debes enviar al menos un campo a actualizar', 'VALIDATION_ERROR')
      }
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          skinTone: body.skinTone,
          skinType: body.skinType,
          preferredStyles: body.preferredStyles,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          skinTone: true,
          skinType: true,
          preferredStyles: true,
          updatedAt: true,
        },
      })
      return res.json(user)
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
