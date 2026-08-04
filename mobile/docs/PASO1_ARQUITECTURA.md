# Paso 1 — Arquitectura híbrida GlowLab (Android host)

## Decisiones confirmadas (Paso 0)

| Decisión | Valor |
|---|---|
| Rol Flutter | Shell + capacidades nativas |
| Rol web | `frontend/` (Vite) = producto |
| applicationId | `com.glowlab.app` |
| minSdk / targetSdk | 24 / 35 |
| Auth | Secure Storage + sync bridge |
| Bridge | Protocolo JSON versionado en `hybrid/` |
| Config | `--dart-define` (flavors Gradle = **Paso 2**) |
| Keystore | `key.properties` gitignored (firma real = **Paso 10**) |

## Capas

```
lib/src/
  core/        Config, errores, logging
  domain/      Contratos (interfaces) sin Flutter plugins
  data/        Implementaciones de repositorios (stubs → reales)
  platform/    Facades nativas por capability
  hybrid/      WebView host + bridge v1
  di/          Riverpod providers
  presentation/ Pantallas nuevas del host (web, splash)
  features/    UI nativa existente (migración gradual)
```

## Criterio de OK del Paso 1

1. `flutter pub get`
2. `flutter analyze`
3. `flutter run` arranca igual (tabs nativos actuales)
4. Cámara AR pausa en `paused`/`inactive`
5. No hay secretos en el repo (`key.properties` ignorado)

## Qué NO incluye este paso

- WebView cargando `frontend/` (Paso 4)
- Bridge ping/pong real (Paso 5)
- productFlavors Gradle (Paso 2)
- Keystore de producción generado (Paso 10)
- Plugins nuevos (geolocator, FCM, etc.) — solo contratos stub
