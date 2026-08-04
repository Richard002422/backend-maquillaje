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
    const text = `${p.name} ${p.description ?? ''}`.toLowerCase()
    if (lastLook === 'natural' && (p.category === 'Skincare' || text.includes('brillo'))) s += 3
    if (lastLook === 'minimal' && (text.includes('natural') || text.includes('fresco'))) s += 2
    if (lastLook === 'fiesta' && p.category === 'Ojos') s += 3
    if (lastLook === 'editorial' && p.category === 'Ojos') s += 2
    if (p.stock > 0) s += 1
    if (cartProductIds.has(p.id)) s -= 5
    scored.set(p.id, s)
  }
  return [...products]
    .sort((a, b) => (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0))
    .slice(0, 8)
    .map((p) => p.id)
}
