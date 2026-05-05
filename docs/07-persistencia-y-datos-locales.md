# 07 — Persistencia y datos locales

## 7.1 Hive: cajas y claves

Inicialización: `lib/src/storage/hive_boxes.dart`.

| Caja Hive | Constante | Contenido |
|-----------|-----------|------------|
| `prefs` | `kPrefsBox` | Preferencias generales + JSON del carrito + último look. |

> **Nota:** todo convive en una sola caja por simplicidad del prototipo. En crecimiento, separar `cart.hive` y `prefs.hive` o migrar a **Isar** para consultas indexadas y migraciones esquema.

## 7.2 Claves lógicas utilizadas

| Clave | Tipo almacenado | Productor | Descripción |
|-------|-----------------|------------|-------------|
| `last_look_id` | `String` | `LastLookIdNotifier` | Último estilo seleccionado (afecta recomendaciones locales). |
| `cart_lines_v1` | `String` (JSON) | `CartNotifier` | Array serializado de líneas de carrito. |

## 7.3 Modelo de carrito

Clase `CartLine` (`lib/src/data/models/cart_line.dart`):

- `productId: String`
- `quantity: int`

Serialización: `jsonEncode` / `jsonDecode` en `CartNotifier` (`lib/src/providers/cart_provider.dart`).

Operaciones expuestas:

- `addProduct(productId, {quantity})`
- `setQuantity(productId, quantity)` — si `quantity <= 0`, elimina la línea.
- `removeProduct`, `clear`

## 7.4 Consistencia y concurrencia

- Hive **no** provee transacciones distribuidas; asumir **un solo proceso** (app) escribiendo.
- Para evitar estados incoherentes entre providers, las mutaciones del carrito **siempre** pasan por `CartNotifier._persist` que actualiza `state` tras escritura en disco.

## 7.5 Migración a Isar (recomendación técnica)

Cuando el catálogo offline, historial de pedidos o wishlist crezcan:

1. Definir **entities** `@collection` con índices compuestos.
2. Añadir `build_runner` + `isar_generator`.
3. Script de migración: leer `cart_lines_v1` legacy → insertar en Isar → borrar clave antigua.

## 7.6 Respaldo y restauración

- **Android Auto Backup / iOS backup iCloud:** pueden incluir archivos Hive en el directorio de la app; evaluar **excludeFromBackup** para datos sensibles.
- **Desinstalación:** borra almacenamiento local; el carrito no es fuente de verdad del inventario.
