import { Router } from 'express'
import { z } from 'zod'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { HttpError } from '../middleware/httpError.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { sendPushMessage } from '../services/pushProvider.js'

const dispatchSchema = z.object({
  // Tope 1000: Django ya envía en lotes más chicos (ver
  // _DISPATCH_BATCH_SIZE en apps/notifications/services.py), esto es un
  // límite defensivo del lado Node, no el tamaño esperado normal.
  userIds: z.array(z.string().trim().min(1)).min(1).max(1000),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  imageUrl: z.string().url().nullable().optional(),
  data: z.record(z.string()).optional(),
})

type DispatchResult = {
  userId: string
  status: 'sent' | 'failed' | 'skipped_no_token' | 'skipped_opted_out'
  providerMessageId?: string
  error?: string
}

/// Concurrencia acotada (no Promise.all sobre los 1000 de una): FCM se
/// banca sobra de sobra, pero el timeout fijo de 10s del lado Django
/// (glowlab.py, no configurable por llamada) es el límite real — 25 en
/// paralelo resuelve un lote de 200 (tamaño real que manda Django) en unos
/// pocos segundos, con margen.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export function adminNotificationsRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  r.post('/dispatch', async (req, res, next) => {
    try {
      const parsed = dispatchSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new HttpError(400, 'Payload inválido', 'VALIDATION_ERROR', parsed.error.flatten())
      }
      const { userIds, title, body, imageUrl, data } = parsed.data

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          marketingOptIn: true,
          deviceTokens: { where: { active: true } },
        },
      })
      const byId = new Map(users.map((u) => [u.id, u]))

      const results = await mapWithConcurrency(userIds, 25, async (userId): Promise<DispatchResult> => {
        const user = byId.get(userId)
        if (!user) return { userId, status: 'failed', error: 'Usuario no encontrado' }
        if (!user.marketingOptIn) return { userId, status: 'skipped_opted_out' }
        if (user.deviceTokens.length === 0) return { userId, status: 'skipped_no_token' }

        // Un usuario puede tener varios dispositivos — se manda a todos,
        // pero se reporta UN resultado por userId (éxito si al menos uno
        // llegó): Django persiste una fila de entrega por destinatario,
        // no por dispositivo físico.
        let messageId: string | undefined
        let lastError: string | undefined
        for (const deviceToken of user.deviceTokens) {
          const sent = await sendPushMessage({ token: deviceToken.token, title, body, imageUrl, data })
          if (sent.ok) {
            messageId = sent.messageId
          } else {
            lastError = sent.error
            if (sent.unregistered) {
              await prisma.deviceToken.update({
                where: { id: deviceToken.id },
                data: { active: false },
              })
            }
          }
        }
        return messageId
          ? { userId, status: 'sent', providerMessageId: messageId }
          : { userId, status: 'failed', error: lastError ?? 'No se pudo enviar' }
      })

      return res.json({ results })
    } catch (e) {
      next(e)
    }
  })

  return r
}
