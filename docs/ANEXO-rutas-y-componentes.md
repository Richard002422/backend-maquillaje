# Anexo — Referencia rápida de rutas y archivos

## A.1 Rutas GoRouter (Flutter)

| Ruta | Nombre | Widget |
|------|--------|--------|
| `/inicio` | `inicio` | `HomeScreen` |
| `/catalogo` | `catalogo` | `CatalogScreen` |
| `/ar` | `ar` | `ArTryOnScreen` |
| `/carrito` | `carrito` | `CartScreen` |
| `/influencers` | `influencers` | `InfluencersScreen` |
| `/producto/:id` | `producto` | `ProductDetailScreen` |
| `/settings` | `settings` | `SettingsScreen` |

Definición: `mobile/lib/src/router/app_router.dart`.

## A.2 Providers Riverpod (índice)

| Provider | Archivo |
|----------|---------|
| `goRouterProvider` | `router/app_router.dart` |
| `prefsBoxProvider`, `lastLookIdProvider` | `providers/prefs_providers.dart` |
| `catalogQueryProvider`, `filteredProductsProvider`, `productByIdProvider`, `allProductsProvider`, `catalogCategoriesProvider` | `providers/catalog_providers.dart` |
| `cartProvider`, `cartTotalProvider` | `providers/cart_provider.dart` |
| `recommendationsProvider` | `providers/recommendations_provider.dart` |
| `restClientProvider` | `providers/api_providers.dart` |

## A.3 Secciones ancla (Web Vite)

| Ancla | Descripción |
|-------|-------------|
| `#inicio` | Hero |
| `#estilos` | Looks |
| `#prueba` | Subida de foto |
| `#catalogo` | Productos |

Fuente: `src/main.ts` + `index.html`.

## A.4 Comandos de verificación local

```bash
# Flutter
cd mobile && flutter pub get && dart analyze lib test

# Web Vite
npm ci && npm run build
```
