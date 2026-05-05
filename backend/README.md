# Backend GlowLab — arquitectura general implementada

Arquitectura aplicada: **microservicios + API Gateway**.

| Servicio | Stack | Exposición | Rol |
|----------|-------|------------|-----|
| `gateway` | Nginx | Pública (`:8080`) | Punto de entrada único, rate limit y reverse proxy. |
| `api` | Node.js 20 + Express + Prisma | Interna (solo red Docker) | API principal, JWT, catálogo, orquestación de IA. |
| `ai` | Python 3.12 + FastAPI | Interna (solo red Docker) | Recomendaciones y try-on. |

## 1) Microservicios vs monolito

Decisión: **microservicios pragmático**.

- Separa ciclo de vida de IA del API de negocio.
- Permite escalar `ai` independientemente.
- Aísla riesgos de cambios en inferencia/modelos.

Si el producto fuera muy pequeño, un monolito podría simplificar operación, pero aquí la separación aporta valor real por carga de IA y evolución de modelos.

## 2) Comunicación entre servicios

### Norte-Sur

Cliente (Flutter/Web) → `gateway` (`http://localhost:8080`) → `api`.

### Este-Oeste

`api` → `ai` mediante `AI_SERVICE_URL=http://ai:8000` con header interno:

`X-Internal-Token: <INTERNAL_AI_TOKEN>`

`ai` nunca debe ser consumido por clientes finales.

## 3) API Gateway (Nginx)

Archivos:

- `backend/gateway/nginx.conf`
- `backend/gateway/Dockerfile`

Comportamiento:

- Publica `/v1/*` y `/health`.
- `limit_req` más estricto en `/v1/auth/*`.
- Rate limit general en resto de `/v1/*`.
- Reenvía cabeceras `X-Forwarded-*`.
- Bloquea rutas no definidas (`/` => `404`).

## 4) Variables de entorno

Base: `backend/.env.example`.

Variables clave:

- `JWT_ACCESS_SECRET`
- `INTERNAL_AI_TOKEN`
- `DATABASE_URL`
- `AI_SERVICE_URL`
- `CORS_ORIGIN`

## 5) Arranque con Docker Compose (arquitectura completa)

Desde `backend/`:

```bash
docker compose up --build -d
```

Guía completa de contenerización: [`backend/DOCKER.md`](./DOCKER.md)

Endpoints:

- Gateway público: `http://localhost:8080`
- API interna: `http://api:4000` (solo red Docker)
- IA interna: `http://ai:8000` (solo red Docker)

## 6) Contrato público (a través del gateway)

Prefijo: `/v1`

- Auth: `/v1/auth/*`
- Productos: `/v1/products`
- Recomendaciones: `/v1/recommendations`
- Try-on: `/v1/try-on`

Health público: `/health` (proxy a API).

## 7) Contrato interno IA

- `POST /internal/v1/recommendations`
- `POST /internal/v1/try-on`

Ambos exigen `X-Internal-Token`.

## 8) Recomendación de producción

- Migrar de SQLite a PostgreSQL.
- Poner WAF/CDN delante del gateway.
- Gestionar secretos con Vault/AWS Secrets Manager/GCP Secret Manager.
- Mantener `ai` sin exposición pública directa.
# Backend GlowLab — producción

Arquitectura implementada: **microservicios con API Gateway**.

| Servicio | Stack | Exposición | Rol |
|----------|-------|------------|-----|
| **gateway** | Nginx | Público (`:8080`) | Entrada única, rate limiting y reverse proxy a API. |
| **api** | Node.js 20 + Express + TypeScript + Prisma | Interna (solo red Docker) | BFF/API pública lógica: JWT, catálogo, orquestación a IA. |
| **ai** | Python 3.12 + FastAPI + Uvicorn | Interna (solo red Docker) | Recomendaciones y try-on (servicio IA). |

Los clientes (Flutter/web) consumen `gateway` en `http://localhost:8080`.  
`api` invoca `ai` con `AI_SERVICE_URL` + `X-Internal-Token`.

## Requisitos

- Node.js ≥ 20  
- Python ≥ 3.12 (solo si ejecutas `ai-service` en local)  
- Docker + Docker Compose (despliegue conjunto)

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y rellena secretos (mínimo 32 caracteres para JWT). Docker Compose lee `backend/.env` cuando ejecutas compose desde `backend/`.

| Variable | Servicio | Descripción |
|----------|----------|-------------|
| `DATABASE_URL` | api | PostgreSQL (`postgresql://usuario:password@host:5432/glowlab?schema=public`). |
| `JWT_ACCESS_SECRET` | api | Firma de access tokens (HS256). El refresh es **opaco** (hash en BD), no JWT. |
| `INTERNAL_AI_TOKEN` | api + ai | Debe coincidir exactamente; nunca exponer al cliente. |
| `AI_SERVICE_URL` | api | URL base del servicio FastAPI (`http://127.0.0.1:8000` en local, `http://ai:8000` en Compose). |
| `CORS_ORIGIN` | api | Orígenes permitidos separados por coma. |

## Desarrollo local

### 1) Servicio IA (FastAPI)

```bash
cd backend/ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy ..\..\.env.example .env   # o crear .env con INTERNAL_AI_TOKEN=...
uvicorn app.main:app --reload --port 8000
```

### 2) API (Express)

```bash
cd backend/api
# Crear .env aquí (puedes partir de ../.env.example): DATABASE_URL, JWT_ACCESS_SECRET, INTERNAL_AI_TOKEN, AI_SERVICE_URL
npm install
npx prisma db push
npm run db:seed
npm run dev
```

La API queda en `http://localhost:4000`.

### 3) Docker Compose (arquitectura completa)

Desde `backend/` con un `.env` válido:

```bash
docker compose up --build -d
```

- Gateway (público): `http://localhost:8080`  
- API (interna): `http://api:4000` dentro de la red Docker  
- IA (interna): `http://ai:8000` dentro de la red Docker

## Contrato HTTP (API pública)

Prefijo público: **`/v1`** a través del **gateway**.

### Autenticación (JWT access + refresh opaco)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/v1/auth/register` | No | `{ "email", "password" }` → `{ accessToken, refreshToken, tokenType, expiresIn }` |
| `POST` | `/v1/auth/login` | No | Igual que register en respuesta. |
| `POST` | `/v1/auth/refresh` | No | `{ "refreshToken" }` → nuevos tokens (rotación: invalida el refresh usado). |
| `POST` | `/v1/auth/logout` | Bearer access | Revoca **todos** los refresh tokens del usuario. |
| `GET` | `/v1/auth/me` | Bearer access | Perfil mínimo `{ id, email, createdAt }`. |

Cabecera: `Authorization: Bearer <accessToken>`.

### Catálogo

| Método | Ruta | Auth | Query / body |
|--------|------|------|----------------|
| `GET` | `/v1/products` | No | `q`, `category`, `maxPrice`, `page`, `pageSize` |
| `GET` | `/v1/products/:id` | No | — |

### Recomendaciones (delegación a FastAPI + fallback)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/v1/recommendations` | Opcional Bearer | Query: `look`, `cart` (ids separados por coma), `limit`. Respuesta: `{ productIds, products }`. |

Si FastAPI no responde, Express aplica **heurística local** para no degradar UX.

### Try-on (multipart → FastAPI)

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| `POST` | `/v1/try-on` | Bearer access | `multipart/form-data`: campo archivo `image`, campo texto `lookId`. |

Respuesta JSON: `{ previewUrl, maskUrls, latencyMs, note }`.

### Salud

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `GET` | `/health/ready` | Incluye ping a base de datos |
| `GET` | `/v1/health` | Versión API |

## Contrato interno (FastAPI)

Solo invocable desde la red de confianza (VPC / Docker). Cabecera obligatoria:

`X-Internal-Token: <INTERNAL_AI_TOKEN>`

| Método | Ruta | Body |
|--------|------|------|
| `POST` | `/internal/v1/recommendations` | JSON `{ user_id, look, cart_product_ids, limit }` |
| `POST` | `/internal/v1/try-on` | `multipart`: `look_id`, `user_id`, `image` |

## API Gateway (Nginx)

Archivos:

- `backend/gateway/nginx.conf`
- `backend/gateway/Dockerfile`

Reglas activas:

- Entrada única por `:8080`
- `limit_req` más estricto en `/v1/auth/*`
- Rate limit general en `/v1/*`
- Forward de cabeceras `X-Forwarded-*`
- Bloqueo de rutas no explícitas (`/` devuelve 404)

## Seguridad — checklist producción

- [x] Migrado a **PostgreSQL** en compose y esquema Prisma actualizado.  
- [ ] Rotar `JWT_ACCESS_SECRET` y `INTERNAL_AI_TOKEN` con gestor de secretos (Vault, AWS SM, etc.).  
- [x] Reverse proxy API Gateway (Nginx) en el borde.  
- [ ] Añadir WAF/CDN gestionado delante del gateway en cloud (Cloudflare/AWS/GCP).  
- [ ] Limitar CORS a dominios reales (`CORS_ORIGIN`).  
- [ ] TLS terminación en el proxy; HSTS.  
- [ ] No exponer el puerto `8000` de FastAPI a Internet; solo red interna.  
- [ ] Sustituir respuesta demo de try-on por pipeline real (segmentación + render) y políticas de retención de imagen.

## Próximos pasos de producto

- Pagos (PSP) y webhooks.  
- Carrito **servidor** sincronizado con usuario autenticado.  
- Observabilidad: OpenTelemetry + logs estructurados (pino).  
- Modelos ML versionados y despliegue blue/green del servicio `ai`.
