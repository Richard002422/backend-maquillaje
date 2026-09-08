import { Router } from 'express'
import type { LashOverlayAsset, Product, ProductCategory, ProductClass, Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { BESTSELLERS_SLUG, LEGACY_CATEGORY_BY_CLASS_SLUG, bestsellersCache } from '../lib/catalogTaxonomy.js'

type ProductWithRelations = Product & {
  lashOverlay?: LashOverlayAsset | null
  catalogCategory?: (ProductCategory & { class: ProductClass }) | null
}

const listQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  // Nuevos filtros jerárquicos — ver docs/05-contratos-api-rest.md. `category`
  // (legado) sigue funcionando igual que antes para clientes que no migren
  // (mobile, ai-service): ambos pueden convivir, `classSlug`/`categorySlug`
  // son la vía recomendada para clientes nuevos.
  classSlug: z.string().optional(),
  categorySlug: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
})

function decimalToNumber(value: Product['price'] | null | undefined): number | null {
  return value == null ? null : Number(value)
}

export function serializeProduct(p: ProductWithRelations) {
  const priceEur = decimalToNumber(p.price) as number
  const lashOverlay = 'lashOverlay' in p ? p.lashOverlay : null
  const catalogCategory = 'catalogCategory' in p ? p.catalogCategory : undefined
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: priceEur,
    // `priceEur` se mantiene por compatibilidad con clientes existentes
    // (frontend/mobile) — para productos que no están en EUR, ya no es
    // literalmente "en euros"; usar `price` + `currency`.
    priceEur,
    currency: p.currency,
    originalPrice: decimalToNumber(p.originalPrice),
    originalPriceEur: decimalToNumber(p.originalPrice),
    discountPercent: p.discountPercent,
    tags: p.tags,
    stockHint: p.stockHint,
    aiPitch: p.aiPitch,
    isActive: p.isActive,
    description: p.description,
    stock: p.stock,
    imageUrl: p.imageUrl,
    imageUrls: p.imageUrls.length > 0 ? p.imageUrls : p.imageUrl ? [p.imageUrl] : [],
    videoUrls: p.videoUrls,
    // SEO: valores crudos (pueden venir null si el admin no los cargó
    // todavía) — el fallback a name/description para <title>/<meta> lo
    // decide quien renderiza la página, no esta API. Se dejan crudos
    // también para que el panel admin (que reusa este mismo serializer)
    // sepa distinguir "no seteado" de "seteado igual al nombre".
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    // Solo presente en productos con probador virtual de pestañas (Fase 4).
    lashOverlay: lashOverlay
      ? {
          overlayUrl: lashOverlay.overlayUrl,
          canvasWidth: lashOverlay.canvasWidth,
          canvasHeight: lashOverlay.canvasHeight,
          anchorInner: { x: lashOverlay.anchorInnerX, y: lashOverlay.anchorInnerY },
          anchorOuter: { x: lashOverlay.anchorOuterX, y: lashOverlay.anchorOuterY },
          eyeWidthRefPx: lashOverlay.eyeWidthRefPx,
        }
      : null,
    // Jerarquía Clase→Categoría. `null` si el producto es legado y todavía
    // no tiene `catalogCategoryId` asignado (ver comentario en schema.prisma)
    // — el frontend lo sigue ubicando por CLASE gracias al mapeo legado del
    // backend, pero no aparece bajo una categoría específica hasta que un
    // admin se lo asigne. `undefined` (campo ausente) si el caller de este
    // serializer no pidió el include — no confundir con `null`.
    taxonomy:
      catalogCategory === undefined
        ? undefined
        : catalogCategory
          ? {
              classId: catalogCategory.class.id,
              classSlug: catalogCategory.class.slug,
              className: catalogCategory.class.name,
              categoryId: catalogCategory.id,
              categorySlug: catalogCategory.slug,
              categoryName: catalogCategory.name,
            }
          : null,
  }
}

export const PRODUCT_INCLUDE = { lashOverlay: true, catalogCategory: { include: { class: true } } } as const

async function categoryIdsForClass(classId: string): Promise<string[]> {
  const rows = await prisma.productCategory.findMany({ where: { classId }, select: { id: true } })
  return rows.map((row) => row.id)
}

/// Bestsellers = productos con más unidades vendidas (OrderItem.quantity)
/// dentro de una clase. Con caché TTL (ver lib/catalogTaxonomy.ts) porque es
/// una agregación cara de recalcular en cada request. Si todavía no hay
/// pedidos (checkout no está construido, ver comentario en Order en
/// schema.prisma) devuelve [] — el caller cae a "más nuevos primero".
async function resolveBestsellerProductIds(classId: string, legacyCategories: string[]): Promise<string[]> {
  const cacheKey = `bestsellers:${classId}`
  const cached = bestsellersCache.get(cacheKey)
  if (cached) return cached

  const categoryIds = await categoryIdsForClass(classId)
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      productId: { not: null },
      product: {
        isActive: true,
        OR: [{ catalogCategoryId: { in: categoryIds } }, { catalogCategoryId: null, category: { in: legacyCategories } }],
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 30,
  })

  const ids = grouped.map((g) => g.productId).filter((id): id is string => Boolean(id))
  bestsellersCache.set(cacheKey, ids)
  return ids
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

      // El catálogo público solo muestra productos activos — un producto
      // desactivado desde el panel admin desaparece de aquí sin borrarse.
      const dbWhere: Prisma.ProductWhereInput = { isActive: true }
      if (q.category) dbWhere.category = q.category
      if (q.maxPrice != null) dbWhere.price = { lte: q.maxPrice }

      let orderBy: Prisma.ProductOrderByWithRelationInput = { name: 'asc' }
      let rankById: Map<string, number> | null = null

      if (q.classSlug) {
        const productClass = await prisma.productClass.findFirst({
          where: { slug: q.classSlug, isActive: true },
        })
        if (!productClass) {
          throw new HttpError(404, 'Clase no encontrada', 'NOT_FOUND')
        }
        const legacyCategories = LEGACY_CATEGORY_BY_CLASS_SLUG[q.classSlug] ?? []

        if (q.categorySlug && q.categorySlug !== BESTSELLERS_SLUG) {
          const category = await prisma.productCategory.findFirst({
            where: { classId: productClass.id, slug: q.categorySlug, isActive: true },
          })
          if (!category) {
            throw new HttpError(404, 'Categoría no encontrada', 'NOT_FOUND')
          }
          dbWhere.catalogCategoryId = category.id
        } else {
          const categoryIds = await categoryIdsForClass(productClass.id)
          dbWhere.OR = [
            { catalogCategoryId: { in: categoryIds } },
            { catalogCategoryId: null, category: { in: legacyCategories } },
          ]

          if (q.categorySlug === BESTSELLERS_SLUG) {
            const bestsellerIds = await resolveBestsellerProductIds(productClass.id, legacyCategories)
            if (bestsellerIds.length > 0) {
              dbWhere.id = { in: bestsellerIds }
              rankById = new Map(bestsellerIds.map((id, index) => [id, index]))
            } else {
              // Sin historial de pedidos todavía: "más vendidos" cae a "más
              // nuevos" dentro de la clase — mejor que una lista vacía.
              orderBy = { createdAt: 'desc' }
            }
          }
        }
      }

      let rows = await prisma.product.findMany({
        where: dbWhere,
        orderBy,
        include: PRODUCT_INCLUDE,
      })

      if (rankById) {
        const rank = rankById
        rows = rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
      }

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

  // Antes de /:id a propósito: si no, Express intentaría resolver
  // "by-slug" como si fuera un :id.
  r.get('/by-slug/:slug', async (req, res, next) => {
    try {
      const p = await prisma.product.findFirst({
        where: { slug: String(req.params.slug), isActive: true },
        include: PRODUCT_INCLUDE,
      })
      if (!p) {
        throw new HttpError(404, 'Producto no encontrado', 'NOT_FOUND')
      }
      return res.json(serializeProduct(p))
    } catch (e) {
      next(e)
    }
  })

  r.get('/:id', async (req, res, next) => {
    try {
      const p = await prisma.product.findUnique({
        where: { id: String(req.params.id) },
        include: PRODUCT_INCLUDE,
      })
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
