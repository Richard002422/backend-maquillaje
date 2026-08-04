import { Router } from 'express'
import type { Product } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'

const listQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
})

function decimalToNumber(value: Product['price']): number {
  return Number(value)
}

export function serializeProduct(p: Product) {
  const priceEur = decimalToNumber(p.price)
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: priceEur,
    priceEur,
    description: p.description,
    stock: p.stock,
    imageUrl: p.imageUrl,
    imageUrls: p.imageUrl ? [p.imageUrl] : [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export function productsRouter() {
  const r = Router()

  r.get('/', async (req, res, next) => {
    try {
      const parsed = listQuery.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Parámetros inválidos', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const q = parsed.data

      const dbWhere: { category?: string; price?: { lte: number } } = {}
      if (q.category) dbWhere.category = q.category
      if (q.maxPrice != null) dbWhere.price = { lte: q.maxPrice }

      let rows = await prisma.product.findMany({
        where: Object.keys(dbWhere).length ? dbWhere : undefined,
        orderBy: { name: 'asc' },
      })

      if (q.q?.trim()) {
        const term = q.q.trim().toLowerCase()
        rows = rows.filter((p) => {
          const haystack = `${p.name} ${p.category} ${p.description ?? ''}`.toLowerCase()
          return haystack.includes(term)
        })
      }

      const total = rows.length
      const skip = (q.page - 1) * q.pageSize
      const items = rows.slice(skip, skip + q.pageSize)

      return res.json({
        items: items.map(serializeProduct),
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
      const p = await prisma.product.findUnique({ where: { id: String(req.params.id) } })
      if (!p) {
        throw new HttpError(404, 'Producto no encontrado', 'NOT_FOUND')
      }
      return res.json(serializeProduct(p))
    } catch (e) {
      next(e)
    }
  })

  return r
}
