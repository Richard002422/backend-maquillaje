# Integracion Node.js <-> FastAPI

## Opcion implementada: HTTP interno sincronico

Se implemento comunicacion HTTP interna entre `backend/api` (Node.js) y `backend/ai-service` (FastAPI) con:

- Token de servicio (`X-Internal-Token`) para autenticacion entre servicios.
- Trazabilidad distribuida (`X-Request-Id`) propagada desde Express hacia FastAPI.
- Timeouts configurables por entorno.
- Reintentos con backoff exponencial y jitter para errores transitorios.
- Fallback local en recomendaciones cuando IA no esta disponible.

### Flujo tecnico

1. Cliente llama a `gateway`.
2. `api` procesa negocio y genera/propaga `X-Request-Id`.
3. `api` llama endpoints internos de `ai-service`:
   - `POST /internal/v1/recommendations`
   - `POST /internal/v1/try-on`
4. `ai-service` devuelve resultados y eco de `X-Request-Id`.
5. `api` responde al cliente y mantiene consistencia con persistencia local.

## Justificacion tecnica

### Por que HTTP ahora

- Menor complejidad operativa: ambos servicios ya usan REST.
- Integracion directa con gateway y herramientas existentes.
- Facilidad de debug en desarrollo y observabilidad inicial.
- Suficiente para latencia actual de recomendaciones/try-on demo.

### Cuando elegir gRPC

- Contratos fuertemente tipados entre muchos microservicios.
- Requisitos estrictos de baja latencia y alto throughput interno.
- Streaming bidireccional o fan-out de inferencia en tiempo real.

### Cuando elegir colas (Redis/RabbitMQ)

- Cargas asincronas de larga duracion (renders pesados, batch de inferencia).
- Necesidad de desacoplar productor/consumidor y absorber picos.
- Reintentos persistentes, DLQ y procesamiento eventual.

## Configuracion relevante

Variables en `backend/.env.example`:

- `AI_SERVICE_URL`
- `INTERNAL_AI_TOKEN`
- `AI_HTTP_TIMEOUT_MS`
- `AI_HTTP_RETRIES`
- `AI_HTTP_RETRY_BASE_MS`

## Archivos implementados

- `backend/api/src/services/aiClient.ts`
- `backend/api/src/middleware/requestId.ts`
- `backend/api/src/routes/recommendations.ts`
- `backend/api/src/routes/tryon.ts`
- `backend/api/src/app.ts`
- `backend/ai-service/app/routers/internal.py`
