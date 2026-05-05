import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'
import { callAiTryOn } from '../services/aiClient.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
})

const bodySchema = z.object({
  lookId: z.string().min(1).max(64),
})

export function tryOnRouter(env: Env) {
  const r = Router()
  r.use(requireAuth(env))

  r.post('/', upload.single('image'), async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        throw new HttpError(400, 'Campo multipart "image" requerido', 'MISSING_IMAGE')
      }
      const parsed = bodySchema.safeParse({ lookId: req.body.lookId })
      if (!parsed.success) {
        throw new HttpError(400, 'lookId inválido', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const { lookId } = parsed.data

      const ai = await callAiTryOn(env, {
        lookId,
        image: req.file.buffer,
        filename: req.file.originalname || 'upload.jpg',
        userId: req.userId!,
      }, { requestId: req.requestId })

      const created = await prisma.makeupTryOnSession.create({
        data: {
          userId: req.userId!,
          lookId,
          sourceImageUrl: null,
          previewUrl: ai.preview_url,
          maskUrls: ai.mask_urls,
          latencyMs: ai.latency_ms,
          note: ai.note ?? null,
          status: 'COMPLETED',
          assets: {
            create: [
              { kind: 'preview', url: ai.preview_url },
              ...Object.entries(ai.mask_urls).map(([kind, url]) => ({ kind: `mask:${kind}`, url })),
            ],
          },
        },
      })

      return res.status(200).json({
        sessionId: created.id,
        previewUrl: ai.preview_url,
        maskUrls: ai.mask_urls,
        latencyMs: ai.latency_ms,
        note: ai.note,
      })
    } catch (e) {
      next(e)
    }
  })

  r.get('/history', async (req, res, next) => {
    try {
      const limit = Number(req.query.limit ?? 20)
      const rows = await prisma.makeupTryOnSession.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        take: Number.isNaN(limit) ? 20 : Math.max(1, Math.min(limit, 100)),
        include: { assets: true },
      })
      return res.json({
        items: rows.map((s) => ({
          id: s.id,
          lookId: s.lookId,
          previewUrl: s.previewUrl,
          maskUrls: s.maskUrls,
          latencyMs: s.latencyMs,
          note: s.note,
          status: s.status,
          createdAt: s.createdAt,
          assets: s.assets.map((a) => ({ id: a.id, kind: a.kind, url: a.url })),
        })),
      })
    } catch (e) {
      next(e)
    }
  })

  r.get('/:sessionId', async (req, res, next) => {
    try {
      const session = await prisma.makeupTryOnSession.findFirst({
        where: { id: req.params.sessionId, userId: req.userId! },
        include: { assets: true },
      })
      if (!session) {
        throw new HttpError(404, 'Sesión de try-on no encontrada', 'NOT_FOUND')
      }
      return res.json({
        id: session.id,
        lookId: session.lookId,
        previewUrl: session.previewUrl,
        maskUrls: session.maskUrls,
        latencyMs: session.latencyMs,
        note: session.note,
        status: session.status,
        createdAt: session.createdAt,
        assets: session.assets.map((a) => ({ id: a.id, kind: a.kind, url: a.url })),
      })
    } catch (e) {
      next(e)
    }
  })

  return r
}
