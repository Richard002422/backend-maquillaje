# Paso 10 — Producción (firma, AAB, R8, Play)

## Objetivo

Dejar el host Android listo para subir a Play Console **sin** meter secretos en git.

| Pieza | Estado |
|---|---|
| Firma release (`key.properties` + `.jks`) | Cableada; tú generas el keystore |
| R8 (`minify` + `shrinkResources`) | Activo en `release` |
| AAB prod | Comando documentado |
| Versiones | `pubspec.yaml` → `versionName` / `versionCode` |
| Checklist Play | Abajo |

## Versiones

En `mobile/pubspec.yaml`:

```yaml
version: 0.1.0+1
#          │     └─ versionCode (entero; debe subir en cada upload a Play)
#          └─ versionName (visible al usuario)
```

Antes de cada release a producción: sube el `+N` (y el semver si aplica).

## Keystore (una sola vez)

```powershell
cd mobile
pwsh ./scripts/create_release_keystore.ps1
```

1. Completa contraseñas en el prompt de `keytool`.
2. Edita `android/key.properties` (`storePassword`, `keyPassword`).
3. **Backup offline** del `.jks` + contraseñas (gestor de secretos). Si se pierde, no hay update en Play con el mismo signing key (salvo Play App Signing con upload key recovery).

Sin `key.properties`, el build `release` firma con **debug** (solo smoke local).

## Build AAB (prod)

```bash
cd mobile
flutter build appbundle --flavor prod --dart-define-from-file=config/prod.json --release
```

Salida típica:

`build/app/outputs/bundle/prodRelease/app-prod-release.aab`

APK de prueba (opcional):

```bash
flutter build apk --flavor prod --dart-define-from-file=config/prod.json --release
```

## R8

En `android/app/build.gradle.kts` (release):

- `isMinifyEnabled = true`
- `isShrinkResources = true`
- `proguard-rules.pro` (Flutter + JS bridge)

Tras el primer AAB, guarda el `mapping.txt` de ese build si quieres desofuscar crashes (Play también lo acepta al subir).

## Checklist Play Console

- [ ] App creada con package `com.glowlab.app` (prod; sin `.dev`)
- [ ] Play App Signing activado (recomendado)
- [ ] Subir AAB a pista interna / cerrada
- [ ] Ficha: título, descripción corta/larga, icono 512, feature graphic, capturas phone
- [ ] Clasificación de contenido (cuestionario)
- [ ] Política de privacidad (URL pública)
- [ ] **Data safety**: cámara, fotos, ubicación (when-in-use), notificaciones; declarar propósito
- [ ] Target API 35 (ya en Gradle)
- [ ] Probar en dispositivo real el AAB interno (WebView prod URL, permisos, bridge)
- [ ] FCM: solo cuando exista `google-services.json` (Paso 9)

## Criterio de OK

- `key.properties.example` + script de keystore existen; `.jks` / `key.properties` **no** están en git.
- `release` tiene R8 activo.
- Comando AAB prod documentado y ejecutable cuando haya keystore.
- Checklist Play revisada (aunque ficha/legal puedan quedar pendientes de negocio).

## Fin de roadmap híbrido 0–10

Con Paso 10 OK el shell Android queda listo para distribución. Siguientes temas opcionales fuera de este roadmap: iOS WebView shell, FCM real, CI que firme con secrets.
