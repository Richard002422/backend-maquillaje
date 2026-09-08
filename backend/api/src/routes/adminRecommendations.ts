import { Router } from 'express'
import { z } from 'zod'
import type { Prisma, Product, Recommendation, RecommendationItem } from '@prisma/client'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { generateRecommendations } from '../modules/recommendations/generate.js'

const RECOMMENDATION_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(RECOMMENDATION_STATUSES).optional(),
  // cuid de User en Node — nunca UUID, ver nota de tipos de id en
  // adminOrders.ts/adminCustomers.ts.
  userId: z.string().trim().optional(),
})

const statusSchema = z.object({ status: z.enum(RECOMMENDATION_STATUSES) })

const generateSchema = z.object({
  userId: z.string().trim().min(1),
  look: z.string().trim().min(1).max(80).optional(),
  cartProductIds: z.array(z.string().trim().min(1)).max(50).default([]),
  limit: z.coerce.number().int().min(1).max(24).default(8),
})

type RecommendationWithItems = Recommendation & {
  items: (RecommendationItem & { product: Product | null })[]
}

const recommendationInclude = {
  items: { orderBy: { rank: 'asc' as const }, include: { product: true } },
} satisfies Prisma.RecommendationInclude

/// Shape pensado para lo que el panel admin (Lumina) puede mostrar de
/// verdad hoy: NO incluye modelId/modelVersion/confidence/ruleIds (el
/// RecommendationRun mockeado en src/types/domain.ts del panel sí los
/// tiene, pero no existe ningún registro de modelos de IA real detrás —
/// ver la arquitectura de la Fase 9, quedó fuera de alcance a propósito).
/// `score`/`reason` por item existen en el schema pero HOY nadie los
/// completa (generateRecommendations solo setea productId/rank) — llegan
/// null hasta que el pipeline de IA los calcule.
function serializeRecommendation(rec: RecommendationWithItems) {
  return {
    id: rec.id,
    customerId: rec.userId,
    requestedLook: rec.requestedLook,
    cartProductIds: rec.cartProductIds,
    status: rec.status.toLowerCase(),
    source: rec.source,
    items: rec.items.map((item) => ({
      productId: item.productId,
      productName: item.product?.name ?? null,
      rank: item.rank,
      score: item.score,
      reason: item.reason,
    })),
    createdAt: rec.createdAt.toISOString(),
  }
}

export function adminRecommendationsRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  r.get('/', async (req, res, next) => {
    try {
      const parsed = listQuery.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Parámetros inválidos', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const q = parsed.data

      const where: Prisma.RecommendationWhereInput = {}
      if (q.status) where.status = q.status
      if (q.userId) where.userId = q.userId

      const [total, rows] = await Promise.all([
        prisma.recommendation.count({ where }),
        prisma.recommendation.findMany({
          where,
          include: recommendationInclude,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
      ])

      return res.json({
        items: rows.map(serializeRecommendation),
        page: q.page,
        pageSize: q.pageSize,
        total,
      })
    } catch (e) {
      next(e)
    }
  })

  r.get('/:id', async (req, res, next) => {
    try {
      const rec = await prisma.recommendation.findUnique({
        where: { id: String(req.params.id) },
        include: recommendationInclude,
      })
      if (!rec) throw new HttpError(404, 'Recomendación no encontrada', 'NOT_FOUND')
      return res.json(serializeRecommendation(rec))
    } catch (e) {
      next(e)
    }
  })

  // Aprobar (-> COMPLETED, visible/usable por la app) o rechazar
  // (-> FAILED, se descarta) una corrida generada para revisión — ver
  // POST /generate más abajo, que es quien la crea en PENDING.
  r.patch('/:id/status', async (req, res, next) => {
    try {
      const body = statusSchema.parse(req.body)
      const existing = await prisma.recommendation.findUnique({
        where: { id: String(req.params.id) },
      })
      if (!existing) throw new HttpError(404, 'Recomendación no encontrada', 'NOT_FOUND')

      const updated = await prisma.recommendation.update({
        where: { id: existing.id },
        data: { status: body.status },
        include: recommendationInclude,
      })
      return res.json(serializeRecommendation(updated))
    } catch (e) {
      next(e)
    }
  })

  // Dispara el mismo pipeline que usa la app en vivo (generateRecommendations,
  // ver modules/recommendations/generate.ts) pero persiste en PENDING en vez
  // de COMPLETED — el admin la revisa acá antes de que exista para el cliente.
  r.post('/generate', async (req, res, next) => {
    try {
      const parsed = generateSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, 'Payload inválido', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const { userId, look, cartProductIds, limit } = parsed.data

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!user) throw new HttpError(404, 'Cliente no encontrado', 'NOT_FOUND')

      const generated = await generateRecommendations(
        env,
        userId,
        look ?? null,
        cartProductIds,
        limit,
        req.requestId,
        'PENDING',
      )
      // generateRecommendations solo devuelve recommendationId=null cuando
      // userId es null — acá siempre viene seteado (validado arriba), así
      // que esto nunca debería disparar; es una guarda defensiva, no un
      // camino esperado.
      if (!generated.recommendationId) {
        throw new HttpError(502, 'No se pudo generar la recomendación', 'GENERATION_FAILED')
      }

      const rec = await prisma.recommendation.findUnique({
        where: { id: generated.recommendationId },
        include: recommendationInclude,
      })
      return res.status(201).json(serializeRecommendation(rec!))
    } catch (e) {
      next(e)
    }
  })

  return r
}
