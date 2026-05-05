# 03 — Cliente Flutter (`mobile/`)

## 3.1 Stack y versiones

Definidas en `mobile/pubspec.yaml` (extracto conceptual):

| Capa | Paquete | Uso |
|------|---------|-----|
| UI | `flutter` (Material 3) | Componentes, theming (`lib/src/theme/app_theme.dart`). |
| Estado | `flutter_riverpod` | `Provider`, `NotifierProvider`, `FutureProvider`. |
| Navegación | `go_router` | Rutas declarativas + shell indexado. |
| Persistencia | `hive_flutter` | Caja `prefs` para preferencias y carrito serializado. |
| Red | `http` | Cliente REST mínimo. |
| Cámara / permisos | `camera`, `permission_handler` | AR en vivo (móvil; ver limitaciones web). |
| Enlaces externos | `url_launcher` | TikTok / Instagram desde influencers. |

**SDK Dart:** restricción `^3.6.0` en `pubspec.yaml` (ajustar según canal Flutter del equipo).

## 3.2 Punto de entrada y bootstrap

Archivo `lib/main.dart`:

1. `WidgetsFlutterBinding.ensureInitialized()`
2. `Hive.initFlutter()` + `openAppBoxes()` (apertura síncrona de cajas necesarias antes del primer frame que lea Hive).
3. `runApp(ProviderScope(child: GlowLabApp()))`

`GlowLabApp` (`lib/src/app.dart`) obtiene `routerConfig` desde `ref.watch(goRouterProvider)` y aplica `MaterialApp.router`.

## 3.3 Navegación (GoRouter)

Definición en `lib/src/router/app_router.dart`.

### Shell principal (`StatefulShellRoute.indexedStack`)

| Índice | Ruta | Pantalla | Responsabilidad |
|--------|------|----------|-----------------|
| 0 | `/inicio` | `HomeScreen` | Conversión, recomendaciones, accesos AR/catálogo, chips de “look”. |
| 1 | `/catalogo` | `CatalogScreen` | Búsqueda + filtros + rejilla. |
| 2 | `/ar` | `ArTryOnScreen` | Cámara + overlay guía + CTA demo. |
| 3 | `/carrito` | `CartScreen` | Líneas, totales, vaciar. |
| 4 | `/influencers` | `InfluencersScreen` | Lista + bottom sheet con enlaces. |

### Rutas de pila raíz

| Ruta | Nombre | Widget |
|------|--------|--------|
| `/producto/:id` | `producto` | `ProductDetailScreen` — carousel de imágenes, copy IA, añadir al carrito. |
| `/settings` | `settings` | `SettingsScreen` — persistencia de look de prueba en Hive. |

**Implementación:** `parentNavigatorKey: _rootNavigatorKey` evita que el detalle quede “atrapado” dentro del shell.

## 3.4 Estado (Riverpod) — mapa de providers

| Provider | Tipo | Archivo | Descripción |
|----------|------|---------|-------------|
| `goRouterProvider` | `Provider<GoRouter>` | `app_router.dart` | Instancia única del router. |
| `prefsBoxProvider` | `Provider<Box>` | `prefs_providers.dart` | Caja Hive `prefs`. |
| `lastLookIdProvider` | `NotifierProvider` | idem | Último estilo seleccionado (string). |
| `catalogQueryProvider` | `NotifierProvider<CatalogQuery>` | `catalog_providers.dart` | Texto búsqueda, categoría, precio máximo. |
| `filteredProductsProvider` | `Provider<List<Product>>` | idem | Derivado de query + catálogo semilla. |
| `productByIdProvider` | `Provider.family` | idem | Resolución de producto por id. |
| `cartProvider` | `NotifierProvider<List<CartLine>>` | `cart_provider.dart` | Carrito + persistencia JSON en Hive. |
| `cartTotalProvider` | `Provider<double>` | idem | Total monetario derivado. |
| `recommendationsProvider` | `FutureProvider<List<Product>>` | `recommendations_provider.dart` | Red + fallback. |
| `restClientProvider` | `Provider<RestClient>` | `api_providers.dart` | Cliente HTTP con `dispose` del `http.Client`. |

## 3.5 Módulos funcionales (features)

Ruta base: `lib/src/features/`.

- **`home/`** — Patrones de conversión (`TrustStrip`, `SocialProofPulse` en `lib/src/widgets/conversion_ui.dart`), lista horizontal de recomendaciones, producto destacado.
- **`catalog/`** — `CatalogScreen`, `ProductDetailScreen`; filtros reactivos.
- **`cart/`** — `CartScreen`; operaciones atómicas sobre lista persistida.
- **`ar/`** — `ArTryOnScreen`, `FaceGuideOverlayPainter`; ciclo de vida de `CameraController`.
- **`influencers/`** — Datos en `lib/src/data/influencers_seed.dart`.
- **`settings/`** — Ajustes y utilidades de depuración / preferencias.
- **`shell/`** — `AppShell` + `NavigationBar` y badge de carrito vía `select` sobre `cartProvider`.

## 3.6 Modelos y datos semilla

- `lib/src/data/models/product.dart`, `cart_line.dart`, `influencer.dart`
- Semillas: `products_seed.dart`, `influencers_seed.dart`

En producción, sustituir semillas por **repositorio** que lea de API y cachee (p. ej. `Drift`, `Isar`, o `hive` con adapters tipados).

## 3.7 Build por plataforma

```bash
cd mobile
flutter pub get
flutter run                    # dispositivo por defecto
flutter build apk              # Android
flutter build ios              # iOS (requiere macOS + Xcode)
flutter build web              # Web (PWA opcional vía manifest en mobile/web/)
```

**Variables de compilación:** `API_BASE` vía `--dart-define=API_BASE=https://api.tu-dominio.com` (ver `lib/src/providers/api_providers.dart`).

## 3.8 Permisos nativos (referencia)

- **Android:** `android/app/src/main/AndroidManifest.xml` — `INTERNET`, `CAMERA`.
- **iOS:** `ios/Runner/Info.plist` — `NSCameraUsageDescription`.

Amplíe según analytics, notificaciones push o Bluetooth (hardware futuro).
