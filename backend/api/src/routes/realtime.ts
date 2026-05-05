import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { requireAuth } from '../middleware/authenticate.js'
import { HttpError } from '../middleware/httpError.js'
import { callAiRealtimeFrame } from '../services/aiClient.js'

const frameSchema = z.object({
  frameBase64: z.string().min(20),
  lookId: z.string().trim().min(1).max(64).default('natural'),
})

export function realtimeRouter(env: Env) {
  const r = Router()
  r.use(requireAuth(env))

  r.post('/process-frame', async (req, res, next) => {
    try {
      const parsed = frameSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, 'Payload inválido', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const ai = await callAiRealtimeFrame(
        env,
        {
          frame_base64: parsed.data.frameBase64,
          look_id: parsed.data.lookId,
        },
        { requestId: req.requestId },
      )
      return res.json({
        frameBase64: ai.frame_base64,
        latencyMs: ai.latency_ms,
        fpsHint: ai.fps_hint,
      })
    } catch (e) {
      next(e)
    }
  })

  return r
}
