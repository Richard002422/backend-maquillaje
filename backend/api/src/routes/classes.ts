import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { BESTSELLERS_LABEL, BESTSELLERS_SLUG } from '../lib/catalogTaxonomy.js'

export function serializeClass(c: { id: string; name: string; slug: string; icon: string | null; displayOrder: number }) {
  return { id: c.id, name: c.name, slug: c.slug, icon: c.icon, displayOrder: c.displayOrder }
}

export function serializeCategory(c: {
  id: string
  name: string
  slug: string
  displayOrder: number
  classId?: string
}) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    displayOrder: c.displayOrder,
    isSynthetic: false as const,
  }
}

/// Contrato público: alimenta el menú deslizable (clases) y la tira
/// horizontal de categorías (categorías de una clase, con "Más vendidos"
/// siempre primero). Ver docs/05-contratos-api-rest.md.
export function classesRouter() {
  const r = Router()

  // GET /v1/classes — menú deslizable (hamburguesa)
  r.get('/', async (_req, res, next) => {
    try {
      const classes = await prisma.productClass.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      })
      return res.json({ items: classes.map(serializeClass) })
    } catch (e) {
      next(e)
    }
  })

  // GET /v1/classes/:classSlug/categories — tira horizontal de una clase.
  // Siempre antepone la pestaña sintética "Más vendidos" (no es una fila de
  // product_categories, ver lib/catalogTaxonomy.ts).
  r.get('/:classSlug/categories', async (req, res, next) => {
    try {
      const classSlug = String(req.params.classSlug)
      const productClass = await prisma.productClass.findFirst({
        where: { slug: classSlug, isActive: true },
      })
      if (!productClass) {
        throw new HttpError(404, 'Clase no encontrada', 'NOT_FOUND')
      }

      const categories = await prisma.productCategory.findMany({
        where: { classId: productClass.id, isActive: true },
        orderBy: { displayOrder: 'asc' },
      })

      const items = [
        { id: null, name: BESTSELLERS_LABEL, slug: BESTSELLERS_SLUG, displayOrder: -1, isSynthetic: true as const },
        ...categories.map(serializeCategory),
      ]

      return res.json({ class: serializeClass(productClass), items })
    } catch (e) {
      next(e)
    }
  })

  return r
}
