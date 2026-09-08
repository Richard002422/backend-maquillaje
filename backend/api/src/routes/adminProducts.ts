import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { isS3Configured, uploadProductImage } from '../lib/s3.js'
import { PRODUCT_INCLUDE, serializeProduct } from '../routes/products.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { slugify } from '../lib/slugify.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

const baseProductFields = {
  name: z.string().trim().min(1).max(255),
  price: z.coerce.number().positive(),
  currency: z.string().trim().toUpperCase().min(3).max(8).default('EUR'),
  originalPrice: z.coerce.number().positive().optional().nullable(),
  discountPercent: z.coerce.number().int().min(0).max(100).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  // LEGADO: se mantiene requerido por compatibilidad (mobile/ai-service lo
  // siguen leyendo) — para productos nuevos, usar además `catalogCategoryId`.
  category: z.string().trim().min(1).max(120),
  // Jerarquía Clase→Categoría (ver GET /v1/admin/classes/:id/categories para
  // obtener los ids válidos). Null explícito des-asigna la categoría.
  catalogCategoryId: z.string().trim().min(1).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  // `imageUrl` (legado, una sola imagen) se conserva por compatibilidad con
  // `POST /:id/images` (upload a S3); `imageUrls` es la galería real que
  // alimenta el carrusel deslizable de la ficha de producto.
  imageUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string().url()).max(20).optional(),
  videoUrls: z.array(z.string().url()).max(10).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  stockHint: z.string().trim().max(160).optional().nullable(),
  aiPitch: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  // Si no se manda, se autogenera a partir de `name` (ver ensureUniqueSlug).
  // Django ya genera y manda su propio slug para lo que crea/edita desde el
  // panel; esto cubre creación directa en Node (seed, futuros scripts).
  slug: z.string().trim().min(1).max(220).optional(),
  metaTitle: z.string().trim().max(70).optional().nullable(),
  metaDescription: z.string().trim().max(160).optional().nullable(),
}

const createProductSchema = z.object(baseProductFields)
const updateProductSchema = z.object(baseProductFields).partial()

function toDecimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(2))
}

/// Genera un slug único a partir de `base` (nombre del producto o un slug
/// explícito ya recortado). `excludeId` evita que un producto choque
/// consigo mismo al actualizar sin cambiar el nombre.
async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'producto'
  let candidate = root
  let n = 2
  // Volumen de productos bajo (panel admin, no catálogo masivo) — un loop
  // secuencial es correcto y simple; si esto crece a miles de productos con
  // el mismo nombre (poco probable) convendría una query única con COUNT.
  while (
    await prisma.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    candidate = `${root}-${n}`
    n += 1
  }
  return candidate
}

export function adminProductsRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  // Listado para el panel admin: a diferencia de GET /v1/products (público),
  // incluye productos inactivos (desactivados, no borrados) y no pagina por
  // relevancia de tienda sino por fecha de creación descendente.
  r.get('/', async (req, res, next) => {
    try {
      const parsed = listQuery.safeParse(req.query)
      if (!parsed.success) {
        throw new HttpError(400, 'Parámetros inválidos', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const q = parsed.data
      const [total, rows] = await Promise.all([
        prisma.product.count(),
        prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          include: PRODUCT_INCLUDE,
        }),
      ])
      return res.json({ items: rows.map(serializeProduct), page: q.page, pageSize: q.pageSize, total })
    } catch (e) {
      next(e)
    }
  })

  r.post('/', async (req, res, next) => {
    try {
      const body = createProductSchema.parse(req.body)
      if (body.catalogCategoryId) {
        const category = await prisma.productCategory.findUnique({ where: { id: body.catalogCategoryId } })
        if (!category) {
          throw new HttpError(400, 'catalogCategoryId no corresponde a ninguna categoría', 'VALIDATION_ERROR')
        }
      }
      const slug = await ensureUniqueSlug(body.slug ?? body.name)
      const product = await prisma.product.create({
        data: {
          name: body.name,
          slug,
          price: toDecimal(body.price),
          currency: body.currency,
          originalPrice: body.originalPrice != null ? toDecimal(body.originalPrice) : null,
          discountPercent: body.discountPercent ?? null,
          description: body.description ?? null,
          category: body.category,
          catalogCategoryId: body.catalogCategoryId ?? null,
          stock: body.stock,
          imageUrl: body.imageUrl ?? body.imageUrls?.[0] ?? null,
          imageUrls: body.imageUrls ?? [],
          videoUrls: body.videoUrls ?? [],
          tags: body.tags ?? [],
          stockHint: body.stockHint ?? null,
          aiPitch: body.aiPitch ?? null,
          isActive: body.isActive ?? true,
          metaTitle: body.metaTitle ?? null,
          metaDescription: body.metaDescription ?? null,
        },
        include: PRODUCT_INCLUDE,
      })
      return res.status(201).json(serializeProduct(product))
    } catch (e) {
      next(e)
    }
  })

  r.get('/:id', async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: String(req.params.id) },
        include: PRODUCT_INCLUDE,
      })
      if (!product) {
        throw new HttpError(404, 'Producto no encontrado', 'NOT_FOUND')
      }
      return res.json(serializeProduct(product))
    } catch (e) {
      next(e)
    }
  })

  // PATCH parcial: solo se envían los campos que cambian. `imageUrls` y
  // `tags`, cuando vienen en el body, REEMPLAZAN la lista completa (no
  // hacen merge) — el panel admin siempre manda el array completo tras editar.
  r.patch('/:id', async (req, res, next) => {
    try {
      const productId = String(req.params.id)
      const body = updateProductSchema.parse(req.body)

      const existing = await prisma.product.findUnique({ where: { id: productId } })
      if (!existing) {
        throw new HttpError(404, 'Producto no encontrado', 'NOT_FOUND')
      }

      // "Unchecked" en vez de ProductUpdateInput: necesitamos poder asignar
      // el escalar `catalogCategoryId` directo (FK), no solo la sintaxis de
      // relación `catalogCategory: { connect/disconnect }`.
      const data: Prisma.ProductUncheckedUpdateInput = {}
      if (body.name !== undefined) data.name = body.name
      if (body.price !== undefined) data.price = toDecimal(body.price)
      if (body.currency !== undefined) data.currency = body.currency
      if (body.originalPrice !== undefined) {
        data.originalPrice = body.originalPrice != null ? toDecimal(body.originalPrice) : null
      }
      if (body.discountPercent !== undefined) data.discountPercent = body.discountPercent
      if (body.description !== undefined) data.description = body.description
      if (body.category !== undefined) data.category = body.category
      if (body.catalogCategoryId !== undefined) {
        if (body.catalogCategoryId !== null) {
          const category = await prisma.productCategory.findUnique({ where: { id: body.catalogCategoryId } })
          if (!category) {
            throw new HttpError(400, 'catalogCategoryId no corresponde a ninguna categoría', 'VALIDATION_ERROR')
          }
        }
        data.catalogCategoryId = body.catalogCategoryId
      }
      if (body.stock !== undefined) data.stock = body.stock
      if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
      if (body.imageUrls !== undefined) {
        data.imageUrls = body.imageUrls
        // Si no se mandó `imageUrl` explícito en este mismo PATCH, mantenemos
        // la imagen de portada legado sincronizada con la nueva galería.
        if (body.imageUrl === undefined) {
          data.imageUrl = body.imageUrls[0] ?? null
        }
      }
      if (body.videoUrls !== undefined) data.videoUrls = body.videoUrls
      if (body.tags !== undefined) data.tags = body.tags
      if (body.stockHint !== undefined) data.stockHint = body.stockHint
      if (body.aiPitch !== undefined) data.aiPitch = body.aiPitch
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle
      if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription
      if (body.slug !== undefined) {
        data.slug = await ensureUniqueSlug(body.slug, productId)
      }

      const updated = await prisma.product.update({ where: { id: productId }, data, include: PRODUCT_INCLUDE })
      return res.json(serializeProduct(updated))
    } catch (e) {
      next(e)
    }
  })

  // Borrado real (no soft-delete) — las relaciones dependientes ya están
  // definidas con onDelete: Cascade (RecommendationItem, LashOverlayAsset) o
  // SetNull (MakeupTryOnSession), así que esto no puede dejar FKs colgando.
  // Para solo "ocultar" un producto sin borrar su historial, usar
  // PATCH { isActive: false } en su lugar.
  r.delete('/:id', async (req, res, next) => {
    try {
      const productId = String(req.params.id)
      const existing = await prisma.product.findUnique({ where: { id: productId } })
      if (!existing) {
        throw new HttpError(404, 'Producto no encontrado', 'NOT_FOUND')
      }
      await prisma.product.delete({ where: { id: productId } })
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  r.post('/:id/images', upload.single('image'), async (req, res, next) => {
    try {
      if (!isS3Configured(env)) {
        throw new HttpError(503, 'Almacenamiento S3 no configurado', 'S3_NOT_CONFIGURED')
      }
      if (!req.file) {
        throw new HttpError(400, 'Debes enviar un archivo en el campo image', 'VALIDATION_ERROR')
      }

      const productId = String(req.params.id)
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        throw new HttpError(404, 'Producto no encontrado', 'NOT_FOUND')
      }

      const { url } = await uploadProductImage(
        env,
        product.id,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname || 'product.jpg',
      )

      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: product.imageUrl ?? url,
          imageUrls: { push: url },
        },
      })

      return res.status(201).json({
        imageUrl: url,
        product: serializeProduct(updated),
      })
    } catch (e) {
      next(e)
    }
  })

  return r
}
