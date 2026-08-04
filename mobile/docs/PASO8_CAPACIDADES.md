# Paso 8 — Share, enlaces, red y descargas

## Objetivo

Exponer capacidades nativas al SPA vía bridge y demos en Ajustes Flutter.

| Mensaje | Dirección | Efecto |
|---|---|---|
| `SHARE` | W→F | Sheet nativo de compartir |
| `OPEN_EXTERNAL` | W→F | Abre URL en navegador |
| `DOWNLOAD` | W→F | Guarda archivo en Documents/downloads |
| `NETWORK_CHANGED` | F→W | `{ online: bool }` al cambiar conectividad |

## Decisiones

| Tema | Package | Por qué |
|---|---|---|
| Share | `share_plus` | Sheet del sistema multiplataforma |
| Links | `url_launcher` (ya estaba) | Facade `LinkService` |
| Red | `connectivity_plus` | Stream + estado inicial |
| Files | `path_provider` + `http` | Scoped storage app-private |

## Cómo verificar

```bash
cd frontend && npm run dev
cd mobile && flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. **Flutter Ajustes** → Compartir / Abrir enlace / Descargar sample.
2. **WebView → Configuración** (sección Capacidades nativas) → mismos botones vía bridge.
3. Activa modo avión → toast **Sin conexión** + estado en Configuración.

## Criterio de OK

- Share abre el sheet del sistema.
- Enlace abre el navegador.
- Download escribe path bajo Documents.
- `NETWORK_CHANGED` llega al SPA.
- `flutter analyze` limpio.

## Próximo

**Paso 9** — GPS + notificaciones push (FCM).
