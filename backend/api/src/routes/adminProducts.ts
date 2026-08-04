import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { isS3Configured, uploadProductImage } from '../lib/s3.js'
import { serializeProduct } from '../routes/products.js'
import { HttpError } from '../middleware/httpError.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

const createProductSchema = z.object({
  name: z.string().trim().min(1).max(255),
  price: z.coerce.number().positive(),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().min(1).max(120),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
})

function requireAdmin(env: Env) {
  return (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    const token = req.header('X-Admin-Token') ?? req.header('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!env.ADMIN_API_TOKEN || token !== env.ADMIN_API_TOKEN) {
      next(new HttpError(401, 'Token de administrador inválido', 'UNAUTHORIZED'))
      return
    }
    next()
  }
}

export function adminProductsRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  r.post('/', async (req, res, next) => {
    try {
      const body = createProductSchema.parse(req.body)
      const product = await prisma.product.create({
        data: {
          name: body.name,
          price: new Prisma.Decimal(body.price.toFixed(2)),
          description: body.description ?? null,
          category: body.category,
          stock: body.stock,
          imageUrl: body.imageUrl ?? null,
        },
      })
      return res.status(201).json(serializeProduct(product))
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
        data: { imageUrl: url },
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
