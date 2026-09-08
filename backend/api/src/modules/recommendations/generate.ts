import type { Product } from '@prisma/client'
import type { Env } from '../../config.js'
import { localRecommendationOrder } from '../../lib/recommendationFallback.js'
import { prisma } from '../../lib/prisma.js'
import { callAiRecommendations } from '../../services/aiClient.js'

export interface GenerateRecommendationsResult {
  products: Product[]
  recommendationId: string | null
  source: 'ai' | 'fallback'
}

/// Núcleo de generación de recomendaciones, compartido por dos callers:
/// GET/POST /v1/recommendations (routes/recommendations.ts, siempre
/// status='COMPLETED' — el cliente ve el resultado de inmediato) y
/// POST /v1/admin/recommendations/generate (routes/adminRecommendations.ts,
/// Fase 8 del panel admin Lumina: status='PENDING', queda para revisión
/// humana antes de que la app la use — Recommendation.status ya tenía ese
/// valor en el schema, nadie lo usaba hasta esta fase). Antes vivía inline
/// en routes/recommendations.ts; se extrajo a un módulo propio porque ahora
/// tiene dos consumidores reales (este directorio existía vacío, con un
/// .gitkeep, como si ya estuviera pensado para esto).
export async function generateRecommendations(
  env: Env,
  userId: string | null,
  look: string | null,
  cartIds: string[],
  limit: number,
  requestId?: string,
  status: 'COMPLETED' | 'PENDING' = 'COMPLETED',
): Promise<GenerateRecommendationsResult> {
  const cartSet = new Set(cartIds)
  const all = await prisma.product.findMany({ where: { stock: { gt: 0 } } })
  let orderedIds: string[]
  let source: 'ai' | 'fallback' = 'ai'

  try {
    const ai = await callAiRecommendations(
      env,
      {
        user_id: userId,
        look,
        cart_product_ids: cartIds,
        limit,
      },
      { requestId },
    )
    orderedIds = ai.product_ids.slice(0, limit)
  } catch (err) {
    console.warn('[recommendations] Servicio IA no disponible, usando fallback local', err)
    orderedIds = localRecommendationOrder(all, look ?? undefined, cartSet).slice(0, limit)
    source = 'fallback'
  }

  const byId = new Map(all.map((p) => [p.id, p]))
  const products = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  let recommendationId: string | null = null
  if (userId) {
    const created = await prisma.recommendation.create({
      data: {
        userId,
        requestedLook: look,
        cartProductIds: cartIds,
        status,
        source,
        items: {
          create: products.map((p, idx) => ({
            productId: p.id,
            rank: idx + 1,
          })),
        },
      },
    })
    recommendationId = created.id
  }

  return { products, recommendationId, source }
}
