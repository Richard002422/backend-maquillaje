# Docker: contenerizacion del backend

Esta carpeta ya queda lista para levantar la arquitectura completa en contenedores:

- `gateway` (Nginx) expuesto en `:8080`
- `api` (Node.js + Express + Prisma) interno
- `ai` (FastAPI + CV pipeline) interno
- `postgres` (PostgreSQL 16) con volumen persistente

## 1) Preparar variables

```bash
cd backend
cp .env.example .env
```

En Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

## 2) Build y arranque

```bash
docker compose up --build -d
```

## 3) Verificar estado

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f ai
docker compose logs -f gateway
```

## 4) Endpoints

- Gateway publico: `http://localhost:8080`
- Health gateway: `http://localhost:8080/health`
- API interna (red docker): `http://api:4000`
- AI interna (red docker): `http://ai:8000`
- Postgres local: `localhost:5432`

## 5) Detener y limpiar

```bash
docker compose down
```

Eliminar tambien volumenes (DB y media):

```bash
docker compose down -v
```

## Notas de diseno

- Se usan `healthcheck` en `postgres`, `api`, `ai`, `gateway`.
- `depends_on` usa `condition: service_healthy` para orden de arranque confiable.
- `api` ejecuta `prisma db push` + `db seed` al iniciar contenedor.
- `ai` persiste artefactos de imagen en volumen `ai_media`.
