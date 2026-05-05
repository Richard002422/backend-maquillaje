# Servicios de IA implementados

## 1) Recomendacion de productos

Endpoint interno: `POST /internal/v1/recommendations`

- Motor hibrido por reglas con pesos por estilo (`natural`, `minimal`, `fiesta`, `editorial`, `soft-glam`).
- Penaliza productos ya presentes en carrito.
- Prioriza atributos por etiquetas y contexto del look.

Ejemplo:

```bash
curl -X POST "http://localhost:8000/internal/v1/recommendations" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: <token>" \
  -d '{
    "user_id": "usr_123",
    "look": "soft-glam",
    "cart_product_ids": ["base-hd"],
    "limit": 5
  }'
```

## 2) Try-on virtual (vision por computadora)

Endpoint interno: `POST /internal/v1/try-on`

- Recibe selfie + `look_id`.
- Ejecuta pipeline CV demo con `Pillow`:
  - normalizacion de imagen,
  - filtros por look,
  - generacion de mascaras sinteticas (labios/ojos),
  - persistencia de artefactos en `MEDIA_DIR`.
- Devuelve URLs estaticas (`MEDIA_BASE_URL`).

## 3) Procesamiento de imagen/video en tiempo real

### HTTP frame-by-frame

Endpoint interno: `POST /internal/v1/realtime/process-frame`

- Recibe frame en base64 y look.
- Procesa frame y responde frame transformado en base64.
- Retorna `latency_ms` y `fps_hint`.

### WebSocket realtime

Endpoint interno: `WS /internal/v1/realtime/ws`

- Header requerido: `x-internal-token`.
- Entrada: JSON con `frame_base64`, `look_id`.
- Salida: JSON con frame procesado y metricas de latencia.

## Variables de entorno del servicio IA

- `INTERNAL_AI_TOKEN`
- `MEDIA_DIR` (default `./media`)
- `MEDIA_BASE_URL` (default `/media`)
