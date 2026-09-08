/// Utilidades compartidas por routes/classes.ts, routes/products.ts y
/// routes/adminClasses.ts/adminCategories.ts para la jerarquía Clase→Categoría
/// (menú deslizable + tira horizontal). Centralizado acá para no repetir el
/// mapeo legado ni la caché de bestsellers en cada router.

/// Slug reservado: NO es una fila de `product_categories`, es una vista
/// calculada (ver bestsellersCache más abajo) que la API sintetiza como
/// primera pestaña de la tira horizontal de cada clase.
export const BESTSELLERS_SLUG = 'mas-vendidos'
export const BESTSELLERS_LABEL = 'Más vendidos'

/// Puente temporal: productos creados antes de esta feature solo tienen el
/// string libre `Product.category` (sin `catalogCategoryId`). Mientras un
/// admin no les asigna una subcategoría real desde el panel, esto es lo que
/// permite que sigan apareciendo al navegar por CLASE (no por categoría
/// específica). Border a quitar cuando el backfill esté completo — ver
/// comentario en la migración 20260905120000_product_class_category_taxonomy.
export const LEGACY_CATEGORY_BY_CLASS_SLUG: Record<string, string[]> = {
  ojos: ['Ojos', 'Pestañas'],
  rostro: ['Rostro'],
  labios: ['Labios'],
  skincare: ['Skincare'],
  tintes: ['Tintes'],
}

/// Caché en memoria muy simple (TTL) para la agregación de bestsellers, que
/// de otra forma recorrería OrderItem en cada request. Suficiente para el
/// volumen actual (un solo proceso Node, ver docker-compose.yml); si la API
/// escala a múltiples instancias, esto debe migrar a Redis (ya está en el
/// stack para lash-tryon-service) o a una columna `Product.salesCount`
/// denormalizada que se actualiza al completar un pedido. Ver punto 14 de
/// la respuesta de arquitectura (optimización a gran escala).
const CACHE_TTL_MS = 5 * 60 * 1000

class TtlCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>()

  get(key: string): T | undefined {
    const hit = this.store.get(key)
    if (!hit) return undefined
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return hit.value
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  }
}

export const bestsellersCache = new TtlCache<string[]>()
