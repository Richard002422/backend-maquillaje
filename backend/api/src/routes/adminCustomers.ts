import { Router } from 'express'
import { z } from 'zod'
import type { CustomerProfile, Prisma, User } from '@prisma/client'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().optional(),
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

      const where: Prisma.UserWhereInput = q.q
        ? {
            OR: [
              { email: { contains: q.q, mode: 'insensitive' } },
              { firstName: { contains: q.q, mode: 'insensitive' } },
              { lastName: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}

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

      const aggregates = await aggregatesForUsers([user.id])
      return res.json(serializeCustomer(user, aggregates.get(user.id) ?? { totalOrders: 0, totalSpent: 0 }))
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
