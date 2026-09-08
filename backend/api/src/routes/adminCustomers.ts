import { Router } from 'express'
import { z } from 'zod'
import type { CustomerProfile, Prisma, User } from '@prisma/client'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  skinType: z.string().trim().min(1).max(40).optional(),
  hasOrders: z.enum(['true', 'false']).optional(),
  registeredAfter: z.coerce.date().optional(),
  registeredBefore: z.coerce.date().optional(),
  lastActiveAfter: z.coerce.date().optional(),
  lastActiveBefore: z.coerce.date().optional(),
})

const statusSchema = z.object({ isActive: z.boolean() })

type UserWithProfile = User & { customerProfile: CustomerProfile | null }
type Aggregate = { totalOrders: number; totalSpent: number }

/// `orders`/`_sum.total`: pedidos cancelados/reembolsados SÍ cuentan en
/// totalOrders (son pedidos reales que existieron) pero no en totalSpent
/// — un cliente no "gastó" un pedido reembolsado. Ajustar acá si el panel
/// necesita otro criterio.
async function aggregatesForUsers(userIds: string[]): Promise<Map<string, Aggregate>> {
  if (userIds.length === 0) return new Map()

  const [counts, sums] = await Promise.all([
    prisma.order.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { _all: true } }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
    }),
  ])

  const map = new Map<string, Aggregate>(userIds.map((id) => [id, { totalOrders: 0, totalSpent: 0 }]))
  for (const row of counts) {
    map.set(row.userId, { ...map.get(row.userId)!, totalOrders: row._count._all })
  }
  for (const row of sums) {
    const current = map.get(row.userId)!
    map.set(row.userId, { ...current, totalSpent: Number(row._sum.total ?? 0) })
  }
  return map
}

function serializeCustomer(u: UserWithProfile, agg: Aggregate) {
  const hasSkinProfile = Boolean(u.skinType || u.customerProfile?.concerns.length || u.customerProfile?.undertone)
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    status: u.status.toLowerCase(),
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    phone: u.phone ?? undefined,
    // "Última actividad" en el panel — ver comentario de lastLoginAt en
    // schema.prisma. null = nunca emitió tokens (cuenta creada por seed/
    // backfill, o registrada pero jamás logueada).
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    // Necesario para decidir elegibilidad de una campaña de notificación
    // (Fase 8) sin otra llamada — ver marketingOptIn en schema.prisma.
    marketingOptIn: u.marketingOptIn,
    preferredStyles: u.preferredStyles,
    skinProfile: hasSkinProfile
      ? {
          skinType: u.skinType ?? undefined,
          concerns: u.customerProfile?.concerns ?? [],
          undertone: u.customerProfile?.undertone ?? undefined,
        }
      : undefined,
    totalOrders: agg.totalOrders,
    totalSpent: agg.totalSpent,
  }
}

function serializeInteraction(e: { type: string; refId: string | null; searchTerm: string | null; createdAt: Date }) {
  return {
    type: e.type.toLowerCase(),
    refId: e.refId ?? undefined,
    searchTerm: e.searchTerm ?? undefined,
    createdAt: e.createdAt.toISOString(),
  }
}

type TryOnSummaryRow = {
  id: string
  lookId: string
  status: string
  createdAt: Date
  product: { id: string; name: string } | null
}

function serializeTryOnSummary(s: TryOnSummaryRow) {
  return {
    id: s.id,
    lookId: s.lookId,
    status: s.status.toLowerCase(),
    productId: s.product?.id,
    productName: s.product?.name,
    createdAt: s.createdAt.toISOString(),
  }
}

type RecommendationSummaryRow = {
  id: string
  status: string
  source: string
  createdAt: Date
  items: Array<{ productId: string; rank: number; score: number | null; product: { name: string } }>
}

function serializeRecommendationSummary(r: RecommendationSummaryRow) {
  return {
    id: r.id,
    status: r.status.toLowerCase(),
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    items: r.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      rank: item.rank,
      score: item.score ?? undefined,
    })),
  }
}

export function adminCustomersRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  r.get('/', async (req, res, next) => {
    try {
      const parsed = listQuery.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Parámetros inválidos', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const q = parsed.data

      const where: Prisma.UserWhereInput = {}
      if (q.q) {
        where.OR = [
          { email: { contains: q.q, mode: 'insensitive' } },
          { firstName: { contains: q.q, mode: 'insensitive' } },
          { lastName: { contains: q.q, mode: 'insensitive' } },
          { phone: { contains: q.q, mode: 'insensitive' } },
        ]
      }
      if (q.status) where.status = q.status
      if (q.skinType) where.skinType = q.skinType
      // orders: { some: {} } / { none: {} } es un filtro relacional real de
      // Prisma (EXISTS/NOT EXISTS), no hace falta traer los pedidos para
      // filtrar por "tiene al menos uno".
      if (q.hasOrders === 'true') where.orders = { some: {} }
      if (q.hasOrders === 'false') where.orders = { none: {} }
      if (q.registeredAfter || q.registeredBefore) {
        where.createdAt = {
          ...(q.registeredAfter ? { gte: q.registeredAfter } : {}),
          ...(q.registeredBefore ? { lte: q.registeredBefore } : {}),
        }
      }
      if (q.lastActiveAfter || q.lastActiveBefore) {
        where.lastLoginAt = {
          ...(q.lastActiveAfter ? { gte: q.lastActiveAfter } : {}),
          ...(q.lastActiveBefore ? { lte: q.lastActiveBefore } : {}),
        }
      }

      const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: { customerProfile: true },
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
      ])

      const aggregates = await aggregatesForUsers(rows.map((u) => u.id))
      const items = rows.map((u) => serializeCustomer(u, aggregates.get(u.id) ?? { totalOrders: 0, totalSpent: 0 }))

      return res.json({ items, page: q.page, pageSize: q.pageSize, total })
    } catch (e) {
      next(e)
    }
  })

  r.get('/:id', async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(req.params.id) },
        include: { customerProfile: true },
      })
      if (!user) throw new HttpError(404, 'Cliente no encontrado', 'NOT_FOUND')

      // Todo lo que solo hace falta en el detalle (no en la lista, que ya
      // paga el costo de N clientes por página): interacciones recientes,
      // sesiones de prueba virtual y corridas de recomendación — las tres
      // señales de comportamiento que pide la vista de perfil del panel.
      const [aggregates, interactions, tryOnSessions, recommendations] = await Promise.all([
        aggregatesForUsers([user.id]),
        prisma.interactionEvent.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        prisma.makeupTryOnSession.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { product: { select: { id: true, name: true } } },
        }),
        prisma.recommendation.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: { orderBy: { rank: 'asc' }, include: { product: { select: { name: true } } } },
          },
        }),
      ])

      return res.json({
        ...serializeCustomer(user, aggregates.get(user.id) ?? { totalOrders: 0, totalSpent: 0 }),
        interactions: interactions.map(serializeInteraction),
        tryOnSessions: tryOnSessions.map(serializeTryOnSummary),
        recommendations: recommendations.map(serializeRecommendationSummary),
      })
    } catch (e) {
      next(e)
    }
  })

  r.patch('/:id/status', async (req, res, next) => {
    try {
      const body = statusSchema.parse(req.body)
      const existing = await prisma.user.findUnique({ where: { id: String(req.params.id) } })
      if (!existing) throw new HttpError(404, 'Cliente no encontrado', 'NOT_FOUND')

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { status: body.isActive ? 'ACTIVE' : 'INACTIVE' },
        include: { customerProfile: true },
      })
      const aggregates = await aggregatesForUsers([updated.id])
      return res.json(serializeCustomer(updated, aggregates.get(updated.id) ?? { totalOrders: 0, totalSpent: 0 }))
    } catch (e) {
      next(e)
    }
  })

  return r
}
