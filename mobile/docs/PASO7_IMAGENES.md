# Paso 7 — Cámara / galería → WebView

## Objetivo

La SPA pide una foto nativa vía bridge; Flutter captura/elige (comprimida) y
devuelve un `dataUrl` para preview en React/Vite.

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| Plugin | `image_picker` | Cámara + galería con resize (`1280px`, quality 70) |
| Mensaje | `PICK_IMAGE` → `IMAGE_PICKED` | Contrato v1 ya definido |
| Transporte | `dataUrl` base64 **limitado (~1.8 MB)** | Preview inmediato; sin endpoint upload aún |
| Permisos | `ensureCamera` / `ensurePhotos` antes del picker | Runtime + Play-friendly |
| Upload API | Diferido | Backend try-on multipart existe; se cableará cuando el flujo IA lo pida |

## Advertencia rendimiento / seguridad

Pasar fotos grandes por el bridge **degrada** el WebView. Por eso comprimimos.
Para producción a escala: Flutter sube a API/S3 y solo manda la **URL** (mejor).

## Cómo verificar

```bash
cd frontend && npm run dev
cd mobile && flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. WebView → **Prueba virtual IA** (con perfil/consentimiento).
2. Marca consentimiento → aparecen **Galería (app)** / **Cámara (app)**.
3. Elige foto → preview + análisis local de tono.
4. Logs Flutter: `← JS PICK_IMAGE` / `→ JS IMAGE_PICKED`.

## Criterio de OK

- Galería y cámara funcionan en dispositivo/emulador con cámara.
- Cancelar no crashea (payload `ok: false`).
- `flutter analyze` limpio.

## Próximo

**Paso 8** — Share, links externos, connectivity, files/downloads.
