import { Router } from 'express'
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

export function productsRouter() {
  const r = Router()

  r.get('/', async (req, res, next) => {
    try {
      const parsed = listQuery.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Parámetros inválidos', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const q = parsed.data

      const dbWhere: { category?: string; priceEur?: { lte: number } } = {}
      if (q.category) dbWhere.category = q.category
      if (q.maxPrice != null) dbWhere.priceEur = { lte: q.maxPrice }

      let rows = await prisma.product.findMany({
        where: Object.keys(dbWhere).length ? dbWhere : undefined,
        orderBy: { name: 'asc' },
      })

      if (q.q?.trim()) {
        const term = q.q.trim().toLowerCase()
        rows = rows.filter((p) => {
          const tags = p.tags as string[]
          return (
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term) ||
            tags.some((t) => t.toLowerCase().includes(term))
          )
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
      const p = await prisma.product.findUnique({ where: { id: req.params.id } })
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

export function serializeProduct(p: {
  id: string
  name: string
  category: string
  priceEur: number
  tags: unknown
  imageUrls: unknown
  stockHint: string | null
  discountPercent: number | null
  aiPitch: string | null
}) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    priceEur: p.priceEur,
    tags: p.tags as string[],
    imageUrls: p.imageUrls as string[],
    stockHint: p.stockHint,
    discountPercent: p.discountPercent,
    aiPitch: p.aiPitch,
  }
}
