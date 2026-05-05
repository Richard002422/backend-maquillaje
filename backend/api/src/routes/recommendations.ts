import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { localRecommendationOrder } from '../lib/recommendationFallback.js'
import { prisma } from '../lib/prisma.js'
import { optionalAuth, requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'
import { callAiRecommendations } from '../services/aiClient.js'
import { serializeProduct } from './products.js'

const querySchema = z.object({
  look: z.string().optional(),
  cart: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(24).default(8),
})

const bodySchema = z.object({
  look: z.string().trim().min(1).max(80).optional(),
  cartProductIds: z.array(z.string().trim().min(1)).max(50).default([]),
  limit: z.coerce.number().int().min(1).max(24).default(8),
})

export function recommendationsRouter(env: Env) {
  const r = Router()

  r.get('/', optionalAuth(env), async (req, res, next) => {
    try {
      const parsed = querySchema.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Query inválida', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const { look, cart, limit } = parsed.data
      const cartIds = (cart ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const generated = await generateRecommendations(
        env,
        req.userId ?? null,
        look ?? null,
        cartIds,
        limit,
        req.requestId,
      )

      return res.json({
        recommendationId: generated.recommendationId,
        source: generated.source,
        productIds: generated.products.map((p) => p.id),
        products: generated.products.map((p) => serializeProduct(p)),
      })
    } catch (e) {
      next(e)
    }
  })

  r.post('/', optionalAuth(env), async (req, res, next) => {
    try {
      const parsed = bodySchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, 'Payload inválido', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const { look, cartProductIds, limit } = parsed.data
      const generated = await generateRecommendations(
        env,
        req.userId ?? null,
        look ?? null,
        cartProductIds,
        limit,
        req.requestId,
      )

      return res.status(201).json({
        recommendationId: generated.recommendationId,
        source: generated.source,
        productIds: generated.products.map((p) => p.id),
        products: generated.products.map((p) => serializeProduct(p)),
      })
    } catch (e) {
      next(e)
    }
  })

  r.get('/history', requireAuth(env), async (req, res, next) => {
    try {
      const limit = Number(req.query.limit ?? 20)
      const rows = await prisma.recommendation.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        take: Number.isNaN(limit) ? 20 : Math.max(1, Math.min(limit, 100)),
        include: {
          items: {
            orderBy: { rank: 'asc' },
            include: { product: true },
          },
        },
      })

      return res.json({
        items: rows.map((rec) => ({
          id: rec.id,
          requestedLook: rec.requestedLook,
          cartProductIds: rec.cartProductIds,
          status: rec.status,
          source: rec.source,
          createdAt: rec.createdAt,
          products: rec.items.map((it) => ({
            rank: it.rank,
            score: it.score,
            reason: it.reason,
            product: serializeProduct(it.product),
          })),
        })),
      })
    } catch (e) {
      next(e)
    }
  })

  return r
}

async function generateRecommendations(
  env: Env,
  userId: string | null,
  look: string | null,
  cartIds: string[],
  limit: number,
  requestId?: string,
) {
  const cartSet = new Set(cartIds)
  const all = await prisma.product.findMany({ where: { isActive: true } })
  let orderedIds: string[]
  let source: 'ai' | 'fallback' = 'ai'

  try {
    const ai = await callAiRecommendations(
      env,
      {
        user_id: userId,
        look,
        cart_product_ids: cartIds,
        limit,
      },
      { requestId },
    )
    orderedIds = ai.product_ids.slice(0, limit)
  } catch (err) {
    console.warn('[recommendations] Servicio IA no disponible, usando fallback local', err)
    orderedIds = localRecommendationOrder(all, look ?? undefined, cartSet).slice(0, limit)
    source = 'fallback'
  }

  const byId = new Map(all.map((p) => [p.id, p]))
  const products = orderedIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p))

  let recommendationId: string | null = null
  if (userId) {
    const created = await prisma.recommendation.create({
      data: {
        userId,
        requestedLook: look,
        cartProductIds: cartIds,
        status: 'COMPLETED',
        source,
        items: {
          create: products.map((p, idx) => ({
            productId: p.id,
            rank: idx + 1,
          })),
        },
      },
    })
    recommendationId = created.id
  }

  return { products, recommendationId, source }
}
