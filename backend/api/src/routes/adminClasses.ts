import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { slugify } from '../lib/slugify.js'
import { serializeClass } from './classes.js'

const baseClassFields = {
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(8).optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().optional(),
  // Si no se manda, se autogenera a partir de `name` (ver ensureUniqueClassSlug).
  slug: z.string().trim().min(1).max(100).optional(),
}

const createClassSchema = z.object(baseClassFields)
const updateClassSchema = z.object(baseClassFields).partial()

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), displayOrder: z.coerce.number().int() })).min(1),
})

/// Igual criterio que ensureUniqueSlug en adminProducts.ts: volumen bajo
/// (un puñado de clases, no miles), loop secuencial simple y correcto.
async function ensureUniqueClassSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'clase'
  let candidate = root
  let n = 2
  while (
    await prisma.productClass.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    candidate = `${root}-${n}`
    n += 1
  }
  return candidate
}

/// CRUD + reordenamiento de "clases" (Ojos, Labios, Rostro...) para el panel
/// admin (Lumina, externo a este repo — ver CLAUDE.md). Mismo patrón que
/// adminProducts.ts: requireAdmin, zod, HttpError unificado.
export function adminClassesRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  // Incluye clases inactivas (a diferencia de GET /v1/classes, público) para
  // que el panel pueda reactivarlas.
  r.get('/', async (_req, res, next) => {
    try {
      const classes = await prisma.productClass.findMany({ orderBy: { displayOrder: 'asc' } })
      return res.json({ items: classes.map(serializeClass) })
    } catch (e) {
      next(e)
    }
  })

  r.post('/', async (req, res, next) => {
    try {
      const body = createClassSchema.parse(req.body)
      const slug = await ensureUniqueClassSlug(body.slug ?? body.name)
      const created = await prisma.productClass.create({
        data: {
          name: body.name,
          slug,
          icon: body.icon ?? null,
          displayOrder: body.displayOrder ?? 0,
          isActive: body.isActive ?? true,
        },
      })
      return res.status(201).json(serializeClass(created))
    } catch (e) {
      next(e)
    }
  })

  // Antes de /:id: un reorder masivo no es un :id.
  r.patch('/reorder', async (req, res, next) => {
    try {
      const body = reorderSchema.parse(req.body)
      await prisma.$transaction(
        body.items.map((item) =>
          prisma.productClass.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } }),
        ),
      )
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  r.patch('/:id', async (req, res, next) => {
    try {
      const classId = String(req.params.id)
      const body = updateClassSchema.parse(req.body)

      const existing = await prisma.productClass.findUnique({ where: { id: classId } })
      if (!existing) {
        throw new HttpError(404, 'Clase no encontrada', 'NOT_FOUND')
      }

      const data: Record<string, unknown> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.icon !== undefined) data.icon = body.icon
      if (body.displayOrder !== undefined) data.displayOrder = body.displayOrder
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.slug !== undefined) data.slug = await ensureUniqueClassSlug(body.slug, classId)

      const updated = await prisma.productClass.update({ where: { id: classId }, data })
      return res.json(serializeClass(updated))
    } catch (e) {
      next(e)
    }
  })

  // Borrado real solo si no tiene categorías (evita huérfanos silenciosos).
  // Para "ocultar" una clase sin borrarla, usar PATCH { isActive: false }.
  r.delete('/:id', async (req, res, next) => {
    try {
      const classId = String(req.params.id)
      const existing = await prisma.productClass.findUnique({ where: { id: classId } })
      if (!existing) {
        throw new HttpError(404, 'Clase no encontrada', 'NOT_FOUND')
      }
      const categoryCount = await prisma.productCategory.count({ where: { classId } })
      if (categoryCount > 0) {
        throw new HttpError(
          409,
          `No se puede borrar: tiene ${categoryCount} categoría(s) asociada(s). Bórralas primero o usa isActive:false para ocultarla.`,
          'CLASS_HAS_CATEGORIES',
        )
      }
      await prisma.productClass.delete({ where: { id: classId } })
      return res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  return r
}
