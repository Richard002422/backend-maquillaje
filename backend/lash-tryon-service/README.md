# lash-tryon-service (Django + DRF)

Servicio dueño del dominio "Probador Virtual de Pestañas con IA": catálogo de
pestañas, sesiones de prueba, resultados y fotografías guardadas. Corre en
paralelo a `backend/api` (Express) y `backend/ai-service` (FastAPI) — no los
reemplaza. Ver la conversación de diseño (Fase 0-8) para la arquitectura
completa: qué datos son dueños de qué servicio, el flujo de subida de fotos
con URLs prefirmadas de S3, y el plan de escalado.

## Por qué existe un backend más, en un lenguaje distinto

Decisión explícita del proyecto (no es indecisión arquitectónica): esta
funcionalidad se construye con Django+DRF a propósito, aceptando la
complejidad operativa de mantener 3 stacks de backend (Node/Express,
Python/FastAPI, Python/Django). Express sigue siendo dueño de usuarios,
carrito, catálogo general y el resto de la app.

## Autenticación: JWT compartido con Express, no un sistema propio

Este servicio **no tiene su propia tabla de usuarios de aplicación**. Valida
el mismo access token que emite `backend/api/src/lib/jwt.ts` (HS256, claims
`{sub, email, typ:'access'}`, issuer `glowlab-api`, audience
`glowlab-clients`) — ver `apps/core/authentication.py`. `JWT_ACCESS_SECRET`
debe ser **idéntico** al de `backend/api/.env`; si Express rota ese secreto,
hay que rotarlo aquí al mismo tiempo.

El `django.contrib.auth` estándar (`auth.User`, admin de Django) sigue
existiendo, pero es **solo para cuentas de staff que administran el catálogo
vía `/admin/`** — no tiene relación con los usuarios finales de la app.

## Setup local (sin Docker)

```bash
cd backend/lash-tryon-service
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
cp .env.example .env              # y completa los valores
python manage.py migrate
python manage.py runserver 8001
```

Requiere una base Postgres llamada `glowlab_lashtryon` — ver
`backend/postgres-init/` (se crea sola en un volumen nuevo de
`docker compose`; si el volumen de Postgres ya existía antes de esta fase,
créala a mano: `docker exec -it glowlab-postgres createdb -U glowlab
glowlab_lashtryon`).

## Setup vía Docker Compose

```bash
cd backend
docker compose up --build -d
```

El servicio no publica ningún puerto al host — es interno, alcanzable solo
desde `gateway` (Nginx) en `/v1/lash-tryon/...` y desde `lash-tryon-worker`
(Celery) en la misma red de Docker.
