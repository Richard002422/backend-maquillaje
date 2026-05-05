# 09 — Build, entornos y despliegue

## 9.1 Matriz de artefactos

| Artefacto | Comando principal | Salida |
|-----------|-------------------|--------|
| Android APK/AAB | `flutter build appbundle` / `flutter build apk` | `mobile/build/app/outputs/...` |
| iOS | `flutter build ipa` | Requiere firma en Xcode o CI macOS. |
| Flutter Web | `flutter build web` | `mobile/build/web/` |
| Vite Web | `npm run build` | `dist/` en raíz |

## 9.2 Entornos (dev / staging / prod)

| Variable / define | Uso |
|-------------------|-----|
| `API_BASE` | Origen REST (`--dart-define` en Flutter). |
| (futuro) `SENTRY_DSN`, `ANALYTICS_KEY` | Observabilidad; inyectar igualmente por define o `--dart-define-from-file`. |

**Flutter flavors:** crear `main_dev.dart` / `main_prod.dart` o usar `--flavor` con esquemas Xcode y `productFlavors` en Gradle para separar `applicationId` y endpoints.

## 9.3 Android — notas de publicación

- **Play App Signing** obligatorio para nuevas apps.
- **Data safety form:** declarar recopilación de “Photos and videos” si se suben imágenes.
- **targetSdkVersion:** mantener alineado con requisitos de Google Play (actualizar anualmente).

Archivos clave ya presentes:

- `mobile/android/app/src/main/AndroidManifest.xml` — permisos base.
- `mobile/android/app/build.gradle.kts` — `applicationId`, versionCode/Name delegados a Flutter.

## 9.4 iOS — notas de publicación

- **Privacy Nutrition Labels** en App Store Connect alineados con capítulo 08.
- **Bitcode:** deprecado; seguir guías Xcode actuales.
- **Cámara:** `NSCameraUsageDescription` ya definido en `ios/Runner/Info.plist`.

## 9.5 Hosting Flutter Web

- Servir `build/web` detrás de CDN.
- Configurar **fallback SPA:** rutas profundas (`/producto/xyz`) deben resolver a `index.html` (CloudFront error pages, nginx `try_files`, etc.).

## 9.6 Hosting Vite (raíz)

- Igual que 9.5 para `dist/`.
- Separar **dominio** de la app Flutter Web si ambos coexisten.

## 9.7 CI/CD (patrón recomendado)

```yaml
# Pseudopipeline
jobs:
  analyze:
    run: flutter analyze && dart format --set-exit-if-changed .
  test:
    run: flutter test
  build_android:
    run: flutter build appbundle --release --dart-define=API_BASE=$API_BASE_STAGING
  build_web:
    run: flutter build web --release --dart-define=API_BASE=$API_BASE_STAGING
```

- Caché de `flutter pub-cache` y Gradle en runners self-hosted o GitHub Actions con acciones oficiales `subosito/flutter-action`.

## 9.8 Versionado semántico

- Flutter: `version: x.y.z+build` en `pubspec.yaml`.
- API: prefijo `/v1` + deprecación con sunset headers (`Deprecation`, `Sunset` RFC 8594) cuando exista `/v2`.
