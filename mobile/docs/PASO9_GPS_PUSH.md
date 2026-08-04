# Paso 9 — GPS + notificaciones

## Objetivo

| Capacidad | Estado en este paso |
|---|---|
| GPS when-in-use | **Listo** (`geolocator` + `GET_LOCATION`) |
| Notificación local | **Listo** (permiso + canal Android) |
| FCM remoto | **Preparado / documentado** (no rompe el build sin Firebase) |

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| GPS | `geolocator` + permiso runtime previo | Precisión y UX clara |
| Push inmediato | `flutter_local_notifications` | Verifica permiso/canal sin Firebase |
| FCM | No activado en Gradle aún | Sin `google-services.json` el APK falla |

## Bridge

| Mensaje | Respuesta |
|---|---|
| `GET_LOCATION` | `LOCATION` `{ ok, latitude, longitude }` |
| `SHOW_LOCAL_NOTIFICATION` | ack `{ ok }` |
| `GET_PUSH_TOKEN` | `PUSH_TOKEN` `{ ok:false, provider:'pending_fcm' }` hasta configurar Firebase |

## Cómo verificar

```bash
cd frontend && npm run dev
cd mobile && flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. Ajustes Flutter → **Obtener ubicación** / **Notificación local**.
2. WebView → Configuración → **GPS** / **Aviso local** / **Token FCM**.
3. Emulador: configura un punto en Extended controls → Location.

## Activar FCM (cuando tengas proyecto Firebase)

1. Firebase Console → añade app Android `com.glowlab.app` (y `.dev` si aplica).
2. Descarga `google-services.json` → `mobile/android/app/google-services.json` (**no** lo subas a git público si tiene secretos de restricción).
3. En `android/settings.gradle.kts` añade el plugin Google Services.
4. En `android/app/build.gradle.kts`: `id("com.google.gms.google-services")`.
5. `flutter pub add firebase_core firebase_messaging`.
6. Sustituye `NotificationService.getDevicePushToken` por `FirebaseMessaging.instance.getToken()`.
7. Justifica notificaciones + ubicación en Play Console Data safety.

Plantilla: `android/app/google-services.json.example` (no sirve para build real).

## Criterio de OK

- GPS devuelve coordenadas (o error claro si GPS off / permiso denied).
- Notificación local aparece en la bandeja.
- `GET_PUSH_TOKEN` responde `pending_fcm` sin crashear.
- `flutter analyze` limpio.

## Próximo

**Paso 10** — Producción: keystore, AAB, R8, versiones, checklist Play.
