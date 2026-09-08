import { Router, type Request } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { slugify } from '../lib/slugify.js'

function serializeCategoryAdmin(c: {
  id: string
  classId: string
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
}) {
  return {
    id: c.id,
    classId: c.classId,
    name: c.name,
    slug: c.slug,
    displayOrder: c.displayOrder,
    isActive: c.isActive,
  }
}

const baseCategoryFields = {
  name: z.string().trim().min(1).max(80),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().optional(),
  slug: z.string().trim().min(1).max(100).optional(),
}

const createCategorySchema = z.object(baseCategoryFields)
const updateCategorySchema = z.object({ ...baseCategoryFields, classId: z.string().min(1) }).partial()

const reorderSchema = z.object({
  classId: z.string().min(1),
  items: z.array(z.object({ id: z.string().min(1), displayOrder: z.coerce.number().int() })).min(1),
})

/// Igual criterio que en adminClasses.ts, pero el slug es único DENTRO de la
/// clase (no globalmente) — ver @@unique([classId, slug]) en schema.prisma.
async function ensureUniqueCategorySlug(classId: string, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'categoria'
  let candidate = root
  let n = 2
  while (
    await prisma.productCategory.findFirst({
      where: { classId, slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    candidate = `${root}-${n}`
    n += 1
  }
  return candidate
}

/// CRUD + reordenamiento de "categorías" dentro de una clase (ej. "Sombra de
/// ojos" dentro de "Ojos") para el panel admin (Lumina). Rutas anidadas bajo
/// /v1/admin/classes/:classId/categories para creación/listado; patch/delete/
/// reorder van por /v1/admin/categories/* porque operan sobre la categoría
/// (o un lote) sin necesitar el classId en la URL.
export function adminCategoriesRouter(env: Env) {
  const nested = Router({ mergeParams: true })
  nested.use(requireAdmin(env))

  // Anotado explícito: `mergeParams: true` es un comportamiento de runtime
  // que TypeScript no infiere solo — sin esto, `req.params` tipa como `{}`
  // porque la propia ruta literal de este router ("/") no declara :classId
  // (vive en el path de montaje del router padre, ver app.ts).
  nested.get('/', async (req: Request<{ classId: string }>, res, next) => {
    try {
      const classId = String(req.params.classId)
      const categories = await prisma.productCategory.findMany({
        where: { classId },
        orderBy: { displayOrder: 'asc' },
      })
      return res.json({ items: categories.map(serializeCategoryAdmin) })
    } catch (e) {
      next(e)
    }
  })

  nested.post('/', async (req: Request<{ classId: string }>, res, next) => {
    try {
      const classId = String(req.params.classId)
      const productClass = await prisma.productClass.findUnique({ where: { id: classId } })
      if (!productClass) {
        throw new HttpError(404, 'Clase no encontrada', 'NOT_FOUND')
      }
      const body = createCategorySchema.parse(req.body)
      const slug = await ensureUniqueCategorySlug(classId, body.slug ?? body.name)
      const created = await prisma.productCategory.create({
        data: {
          classId,
          name: body.name,
          slug,
          displayOrder: body.displayOrder ?? 0,
          isActive: body.isActive ?? true,
        },
      })
      return res.status(201).json(serializeCategoryAdmin(created))
    } catch (e) {
      next(e)
    }
  })

  const flat = Router()
  flat.use(requireAdmin(env))

  flat.patch('/reorder', async (req, res, next) => {
    try {
      const body = reorderSchema.parse(req.body)
      await prisma.$transaction(
        body.items.map((item) =>
          prisma.productCategory.update({
            where: { id: item.id },
            data: { displayOrder: item.displayOrder, classId: body.classId },
          }),
        ),
      )
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  flat.patch('/:id', async (req, res, next) => {
    try {
      const categoryId = String(req.params.id)
      const body = updateCategorySchema.parse(req.body)

      const existing = await prisma.productCategory.findUnique({ where: { id: categoryId } })
      if (!existing) {
        throw new HttpError(404, 'Categoría no encontrada', 'NOT_FOUND')
      }

      const targetClassId = body.classId ?? existing.classId
      if (body.classId !== undefined) {
        const targetClass = await prisma.productClass.findUnique({ where: { id: body.classId } })
        if (!targetClass) {
          throw new HttpError(400, 'La clase destino no existe', 'VALIDATION_ERROR')
        }
      }

      const data: Record<string, unknown> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.displayOrder !== undefined) data.displayOrder = body.displayOrder
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.classId !== undefined) data.classId = body.classId
      if (body.slug !== undefined) {
        data.slug = await ensureUniqueCategorySlug(targetClassId, body.slug, categoryId)
      } else if (body.classId !== undefined && body.classId !== existing.classId) {
        // Cambiar de clase sin mandar slug nuevo: el slug viejo podría chocar
        // en la clase destino (@@unique([classId, slug])) — se resuelve solo.
        data.slug = await ensureUniqueCategorySlug(targetClassId, existing.slug, categoryId)
      }

      const updated = await prisma.productCategory.update({ where: { id: categoryId }, data })
      return res.json(serializeCategoryAdmin(updated))
    } catch (e) {
      next(e)
    }
  })

  // Borrado real solo si no tiene productos asignados (evita huérfanos
  // silenciosos). Para "ocultar" sin borrar, usar PATCH { isActive: false }.
  flat.delete('/:id', async (req, res, next) => {
    try {
      const categoryId = String(req.params.id)
      const existing = await prisma.productCategory.findUnique({ where: { id: categoryId } })
      if (!existing) {
        throw new HttpError(404, 'Categoría no encontrada', 'NOT_FOUND')
      }
      const productCount = await prisma.product.count({ where: { catalogCategoryId: categoryId } })
      if (productCount > 0) {
        throw new HttpError(
          409,
          `No se puede borrar: tiene ${productCount} producto(s) asignado(s). Reasígnalos primero o usa isActive:false para ocultarla.`,
          'CATEGORY_HAS_PRODUCTS',
        )
      }
      await prisma.productCategory.delete({ where: { id: categoryId } })
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  return { nested, flat }
}
