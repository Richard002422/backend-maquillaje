# Paso 2 — Flavors `dev` / `prod` + config URLs

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| Flavors Gradle | `dev`, `prod` (dimension `env`) | Separar cleartext, appId y nombre en launcher |
| `applicationIdSuffix` | `.dev` solo en dev | Instalar ambas builds en un teléfono |
| URLs | `config/dev.json` + `config/prod.json` | `--dart-define-from-file` sin secretos en código |
| Cleartext HTTP | Solo manifest `src/dev` | Emulador/LAN; prod fuerza HTTPS |

## Alternativa descartada

| Opción | Por qué no |
|---|---|
| Un solo applicationId | No puedes tener dev+prod lado a lado |
| Leer `.env` en runtime | Fácil de olvidar en assets; no es compile-time |
| Hardcode URLs en Dart | Rompe prod/dev y filtra hosts de staging |

## Cómo verificar

```bash
cd mobile
flutter pub get
flutter analyze

# Dev (emulador → host machine = 10.0.2.2)
flutter run --flavor dev --dart-define-from-file=config/dev.json

# Prod (URLs placeholder hasta tener dominios reales)
flutter run --flavor prod --dart-define-from-file=config/prod.json
```

**Importante:** con flavors activos, `flutter run` **sin** `--flavor` falla. Usa siempre `--flavor dev` o `prod`.

En el launcher debes ver **GlowLab Dev** (`com.glowlab.app.dev`) o **GlowLab** (`com.glowlab.app`).

## Criterio de OK

1. `flutter analyze` limpio  
2. `flutter run --flavor dev --dart-define-from-file=config/dev.json` arranca  
3. Log de boot muestra `flavor=dev` y URLs de `config/dev.json`  
4. No se implementó WebView todavía (Paso 4)

## Advertencias

- URLs en `config/prod.json` son **placeholders** (`api.glowlab.app` / `app.glowlab.app`). Cámbialas antes de release.
- iOS schemes/flavors quedan para más adelante (foco Android).
- Dispositivo físico: sustituye `10.0.2.2` por la IP LAN de tu PC.
- Se corrigió icono launcher ausente (`@mipmap/ic_launcher` → `@drawable/ic_launcher`). Sin esto el APK no linkea recursos.
- Si Gradle se cuelga (Kotlin daemon / OneDrive): `cd android && .\\gradlew --stop` y reintenta.
