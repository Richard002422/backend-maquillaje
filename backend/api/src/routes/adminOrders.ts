import { Router } from 'express'
import { z } from 'zod'
import type { Order, OrderItem, Prisma, User } from '@prisma/client'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().optional(),
})

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) })

type OrderWithRelations = Order & { user: User; items: OrderItem[] }

function toDecimalNumber(value: Prisma.Decimal | null | undefined): number {
  return value == null ? 0 : Number(value)
}

/// Shape 1:1 con `Order`/`OrderItem`/`Customer` en src/types/domain.ts del
/// panel admin (Lumina) — Django reenvía esto casi sin tocar, solo agrega
/// `sku` a cada item cuando tiene ese producto en su caché local (Node no
/// modela SKU).
export function serializeOrder(o: OrderWithRelations) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.userId,
    customer: {
      id: o.user.id,
      email: o.user.email,
      firstName: o.user.firstName ?? '',
      lastName: o.user.lastName ?? '',
      status: o.user.status.toLowerCase(),
      createdAt: o.user.createdAt.toISOString(),
      updatedAt: o.user.updatedAt.toISOString(),
    },
    items: o.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: toDecimalNumber(item.unitPrice),
      total: toDecimalNumber(item.total),
      imageUrl: item.imageUrl,
    })),
    status: o.status.toLowerCase(),
    subtotal: toDecimalNumber(o.subtotal),
    discount: toDecimalNumber(o.discount),
    shipping: toDecimalNumber(o.shipping),
    tax: toDecimalNumber(o.tax),
    total: toDecimalNumber(o.total),
    currency: o.currency,
    shippingAddress: o.shippingLine1
      ? {
          line1: o.shippingLine1,
          line2: o.shippingLine2,
          city: o.shippingCity ?? '',
          state: o.shippingState ?? '',
          postalCode: o.shippingPostalCode ?? '',
          country: o.shippingCountry ?? '',
        }
      : null,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }
}

const orderInclude = { user: true, items: true } satisfies Prisma.OrderInclude

export function adminOrdersRouter(_env: Env) {
  const r = Router()
  r.use(requireAdmin(_env))

  r.get('/', async (req, res, next) => {
    try {
      const parsed = listQuery.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Parámetros inválidos', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const q = parsed.data

      const where: Prisma.OrderWhereInput = {}
      if (q.status) where.status = q.status
      if (q.q) {
        where.OR = [
          { orderNumber: { contains: q.q, mode: 'insensitive' } },
          { user: { email: { contains: q.q, mode: 'insensitive' } } },
        ]
      }

      const [total, rows] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          include: orderInclude,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
      ])

      return res.json({ items: rows.map(serializeOrder), page: q.page, pageSize: q.pageSize, total })
    } catch (e) {
      next(e)
    }
  })

  r.get('/:id', async (req, res, next) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: String(req.params.id) },
        include: orderInclude,
      })
      if (!order) throw new HttpError(404, 'Pedido no encontrado', 'NOT_FOUND')
      return res.json(serializeOrder(order))
    } catch (e) {
      next(e)
    }
  })

  r.patch('/:id/status', async (req, res, next) => {
    try {
      const body = statusSchema.parse(req.body)
      const existing = await prisma.order.findUnique({ where: { id: String(req.params.id) } })
      if (!existing) throw new HttpError(404, 'Pedido no encontrado', 'NOT_FOUND')

      const updated = await prisma.order.update({
        where: { id: existing.id },
        data: { status: body.status },
        include: orderInclude,
      })
      return res.json(serializeOrder(updated))
    } catch (e) {
      next(e)
    }
  })

  return r
}
