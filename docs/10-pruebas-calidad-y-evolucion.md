# 10 — Pruebas, calidad y evolución

## 10.1 Estado actual de tests

| Ámbito | Ubicación | Descripción |
|--------|-----------|-------------|
| Widget | `mobile/test/widget_test.dart` | Arranque de `GlowLabApp` con Hive inicializado vía `hive_flutter`. |
| Smoke | `mobile/test/smoke_test.dart` | Test trivial de entorno. |

**Deuda:** cobertura baja; no hay tests de integración de router ni de providers con `ProviderContainer`.

## 10.2 Estrategia recomendada

### Unitarios (Dart)

- **Providers:** usar `ProviderContainer` + overrides (`restClientProvider` → mock) para validar `recommendationsProvider` y `CartNotifier`.
- **RestClient:** mockear `http.Client` con `MockClient` (paquete `http` testing) o `http.testing`.

### Widget / golden

- Pantallas críticas: `CatalogScreen`, `CartScreen` con datos inyectados.
- **Goldens** solo en CI Linux con mismo Skia (cuidado con fuentes: cargar `GoogleFonts` mock o deshabilitar).

### Integración (E2E)

- **Patrol** o **integration_test** con emulador CI para flujos: permiso cámara simulado, añadir al carrito, persistencia tras reinicio.

## 10.3 Calidad estática

- `dart analyze` sin issues (objetivo CI gate).
- `dart format` en pre-commit.
- `flutter_lints` en `mobile/analysis_options.yaml` — ir endureciendo reglas (`strict-casts`, `strict-inference`).

## 10.4 Observabilidad

- **Cliente:** Sentry/Crashlytics con breadcrumbs de navegación (`GoRouter` observer).
- **Red:** correlación `X-Request-Id` generada en cliente para trazar con logs servidor.

## 10.5 Roadmap técnico sugerido (priorizado)

1. **Contrato OpenAPI** y cliente generado o manual tipado estricto.
2. **Motor AR:** integrar ML Kit o MediaPipe + filtros de suavizado + pruebas de rendimiento.
3. **Repositorio de catálogo** remoto con caché (TTL) y imágenes optimizadas (WebP/AVIF).
4. **Auth** (OIDC) y carrito **sincronizado** para usuarios logados.
5. **Feature flags** remotos para activar AR beta por porcentaje de usuarios.
6. **Unificación o separación explícita** de las dos superficies web (documentar en producto).

## 10.6 Mantenimiento de dependencias

- `flutter pub outdated` mensual.
- Revisar **breaking changes** de `camera`, `go_router`, `riverpod` en changelog antes de major bumps.
