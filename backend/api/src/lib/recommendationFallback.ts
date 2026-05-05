import type { Product } from '@prisma/client'

type Look = string | undefined

/** Heurística local si el servicio de IA no está disponible. */
export function localRecommendationOrder(
  products: Product[],
  lastLook: Look,
  cartProductIds: Set<string>,
): string[] {
  const scored = new Map<string, number>()
  for (const p of products) {
    let s = 0
    const tags = p.tags as unknown as string[]
    if (p.aiPitch) s += 2
    if (lastLook === 'natural' && tags.some((t) => t.includes('lumin'))) s += 3
    if (lastLook === 'minimal' && tags.some((t) => t.includes('natural') || t.includes('fresco'))) s += 2
    if (lastLook === 'fiesta' && p.category === 'Ojos') s += 3
    if (lastLook === 'editorial' && tags.includes('editorial')) s += 3
    if (cartProductIds.has(p.id)) s -= 5
    if (p.discountPercent != null) s += 1
    scored.set(p.id, s)
  }
  return [...products]
    .sort((a, b) => (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0))
    .slice(0, 8)
    .map((p) => p.id)
}
