# Paso 5 — Bridge JSON v1 (Flutter ↔ JavaScript)

## Objetivo

Canal bidireccional versionado entre WebView y el SPA `frontend/`.
Validación: **PING → PONG**.

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| Canal Android | `JavascriptChannel` `GlowLabBridgeChannel` | API oficial `webview_flutter` |
| Contrato | JSON `{ version, type, requestId, payload }` | Extensible (OCP) sin romper clientes |
| Dispatcher | `BridgeDispatcher` + `PingHandler` | Un handler por tipo |
| Cliente web | `frontend/src/bridge/glowlab-bridge.ts` | Separado del monolito `main.ts` |
| Bootstrap | `HOST_READY` al `onPageFinished` | La web sabe cuándo el host está listo |

## Flujo

```
JS: GlowLabBridgeChannel.postMessage(JSON.stringify(PING))
        ↓
Flutter: WebViewBridgeBinder → BridgeDispatcher → PingHandler
        ↓
JS: window.GlowLabBridge._receiveFromFlutter(PONG)
```

## Cómo verificar

```bash
# Terminal A
cd frontend && npm run dev

# Terminal B
cd mobile
flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. Abre **Producto web**.
2. En logs Flutter: `← JS PING` y `→ JS PONG`.
3. En la web: toast **“Bridge OK: Flutter respondió PONG”**.
4. En consola WebView (chrome://inspect): `[GlowLabBridge] PONG`.

## Criterio de OK

- PING/PONG funciona dentro del WebView.
- En Chrome de escritorio el bridge no rompe la app (`isNative === false`).
- `flutter analyze` limpio.
- Auth sync aún no (Paso 6).

## Advertencia seguridad

No enviar tokens por este canal hasta Secure Storage (Paso 6). El PING no lleva secretos.
