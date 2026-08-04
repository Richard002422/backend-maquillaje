# Paso 6 — Auth sync (Secure Storage + bridge)

## Objetivo

Compartir la sesión JWT entre Flutter y el SPA:

| Dirección | Mensaje | Efecto |
|---|---|---|
| Web → Flutter | `AUTH_UPDATED` | Guarda sesión en Secure Storage |
| Web → Flutter | `LOGOUT` | Borra Secure Storage |
| Flutter → Web | `AUTH_SYNC` | Inyecta sesión al `localStorage` del WebView |

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| Almacén nativo | `flutter_secure_storage` | Keystore/Keychain; no Hive |
| Espejo web | `localStorage` | Necesario para `fetch` Bearer del SPA |
| Fuente de verdad en app | Secure Storage | Sobrevive reinicios; se empuja en `HOST_READY` |
| Refresh token en bridge | Sí, cifrado en tránsito solo en proceso local WebView | Necesario para refresh; **no** loguear tokens |

## Advertencia seguridad

Los tokens cruzan el bridge JS. Eso es inherente al híbrido. Mitigaciones:

- No loguear `accessToken` / `refreshToken` en cleartext.
- Secure Storage como persistencia nativa.
- En Paso posteriores: cookies HttpOnly si el backend lo permite (opción B).

## Cómo verificar

```bash
cd frontend && npm run dev
cd mobile && flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. Abre WebView → inicia sesión / crea cuenta en la web.
2. Logs Flutter: `← JS AUTH_UPDATED` y `Session saved to secure storage`.
3. Cierra y vuelve a abrir WebView → toast **Sesión sincronizada** (`AUTH_SYNC`).
4. Logout en la web → `← JS LOGOUT` y storage nativo vacío.

## Criterio de OK

- Login web persiste en nativo.
- Reabrir WebView restaura sesión vía `AUTH_SYNC`.
- Logout limpia ambos lados.
- `flutter analyze` limpio.

## Próximo

**Paso 7** — Cámara / galería / upload vía bridge.
