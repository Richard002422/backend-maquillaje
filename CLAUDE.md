# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GlowLab — an AI-assisted makeup app. Monorepo with a **Flutter client** (Android/iOS/Web, `mobile/`), a **hybrid web app** that runs both standalone and embedded inside the Flutter WebView (`frontend/`), and a **microservices backend** (`backend/`: Nginx gateway + Express API + FastAPI AI service + Django/DRF lash-tryon-service). Full technical docs (Spanish, advanced level) live in `docs/` — read `docs/README.md` first for the chapter map; the notes below are the parts that don't fit a quick file read.

## Repo layout — what's live vs. legacy/generated

This repo has accumulated duplicate/legacy paths. Know which is which before editing:

| Path | Status |
|------|--------|
| `mobile/` | **Live.** Flutter client, source of truth for the app shell/native features. |
| `backend/` | **Live.** Gateway + API + AI service + lash-tryon-service, source of truth for backend. |
| `frontend/` | **Live.** Current web app (Vite+TS), served standalone and inside the Flutter WebView. Root `package.json`'s `dev`/`build`/`preview` scripts delegate here. |
| `src/`, root `index.html` | **Legacy.** Original Vite SPA prototype, superseded by `frontend/` (which has the same files plus `auth.ts`, `products.ts`, `profile.ts`, `recommendations.ts`, `bridge/`). Reachable via `npm run dev:legacy-root` / `build:legacy-root`. Don't add new features here. |
| `_push-backend/`, `_push-frontend/` | **Deploy mirrors**, each its own git repo (remotes `app-maquillaje-backend`, `app-maquillaje-frontend`) used to push subtrees to their standalone deployment repos. Mirror `backend/`/`frontend/`; don't diverge them — edit the real source and re-sync. |
| `dist/`, `build/`, `mobile/build/`, `**/node_modules` | Generated output. Never hand-edit. |
| `docs/` | Architecture docs (numbered chapters + annex), Spanish, prescriptive for API contracts. |
| `postman/`, `.postman/` | Postman collections/specs for the API. |

## Commands

### Root (delegates to `frontend/`)
```bash
npm install
npm run dev        # -> frontend dev server (Vite, 127.0.0.1:5173)
npm run build      # -> frontend build
npm run preview    # -> frontend preview
```

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev        # vite --host 127.0.0.1 --port 5173 --strictPort
npm run build       # vite build -> dist/
npm run preview     # vite preview --host 127.0.0.1 --port 5173 --strictPort
```
No test/lint scripts are defined here.

### Backend API (`backend/api/`, Node 20 + Express + TypeScript + Prisma)
```bash
cd backend/api
npm install
npx prisma db push       # sync schema to DATABASE_URL (Postgres)
npm run db:seed          # tsx prisma/seed.ts
npm run dev               # tsx watch src/server.ts -> http://localhost:4000
npm run build && npm start   # tsc -> dist/, then node dist/server.js
npm run db:generate       # prisma generate (also runs on postinstall)
npm run db:migrate        # prisma migrate deploy
```
No test/lint scripts are defined here either. `.env` (not committed) needs at minimum `DATABASE_URL`, `JWT_ACCESS_SECRET` (32+ chars), `INTERNAL_AI_TOKEN`, `AI_SERVICE_URL`, `CORS_ORIGIN` — see `backend/.env.example`.

### AI service (`backend/ai-service/`, Python 3.12 + FastAPI)
```bash
cd backend/ai-service
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Lash try-on service (`backend/lash-tryon-service/`, Python 3.12 + Django 6 + DRF)
Owns the "AI Virtual Try-On" domain (lash catalog, sessions, results, photos) — a deliberate second backend alongside Express, not a replacement. See `backend/lash-tryon-service/README.md` for why.
```bash
cd backend/lash-tryon-service
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env    # JWT_ACCESS_SECRET here must match backend/api/.env exactly
python manage.py migrate
python manage.py runserver 8001
celery -A config worker --loglevel=INFO   # separate terminal — needs Redis running
```
No local user model: `apps/core/authentication.py` verifies the same JWT that `backend/api/src/lib/jwt.ts` issues (shared `JWT_ACCESS_SECRET`, HS256, issuer `glowlab-api`, audience `glowlab-clients`). `django.contrib.auth`/`/admin/` is only for staff accounts managing the catalog, unrelated to app end users.

### Full stack via Docker Compose
```bash
cd backend
docker compose up --build -d
# gateway (public): http://localhost:8080 — /v1/* -> api, /v1/lash-tryon/* -> lash-tryon.
# api/ai/lash-tryon/lash-tryon-worker/redis stay on the internal docker network.
```

### Mobile (`mobile/`, Flutter)
```bash
cd mobile
flutter pub get
flutter run
flutter test                                       # runs test/smoke_test.dart, test/widget_test.dart
flutter build apk --dart-define=API_BASE=https://api.tu-dominio.com
flutter build web
```

## Architecture

### Backend: gateway → API → AI, one internal-only hop
- **Nginx gateway** (`backend/gateway/`) is the only public surface. Publishes `/v1/*` and `/health`; everything else 404s. Stricter rate limiting on `/v1/auth/*`.
- **Express API** (`backend/api/src/`) owns business logic, JWT auth (access token JWT + opaque hashed refresh token), the Prisma/Postgres catalog, and orchestrates calls to the AI service. Clients never talk to the AI service directly.
- **FastAPI AI service** (`backend/ai-service/app/`) only accepts calls from the API, gated by a shared `X-Internal-Token` header (`INTERNAL_AI_TOKEN` must match on both sides). Internal contract: `POST /internal/v1/recommendations`, `POST /internal/v1/try-on`.
- If the AI service is unreachable, the API falls back to a local heuristic (`src/lib/recommendationFallback.ts`) rather than degrading the UX — keep that fallback in sync with any change to the recommendation contract.
- Full HTTP contract (auth, products, recommendations, try-on, health) is documented in `backend/api/ARCHITECTURE.md` and `docs/05-contratos-api-rest.md`.
- **`backend/lash-tryon-service/`** (Django + DRF) is a third, independent backend — deliberately, not incidentally. It owns the AI virtual try-on domain end to end (lash catalog, sessions, results, photos in S3) and is reached through the same gateway under `/v1/lash-tryon/`. It never talks to Prisma/Postgres-owned-by-Express directly; it trusts Express's JWT (shared secret) instead of owning its own user table. Face/landmark detection stays 100% on-device (MediaPipe in the browser, see `frontend/src/features/lash-tryon/`) — this service never runs AI inference, only catalog/session/photo persistence and async post-processing (thumbnails) via Celery+Redis.

### Backend API internal structure (`backend/api/src/`)
Two structures currently coexist by design (see `backend/api/ARCHITECTURE.md`): the **active** implementation (`routes/`, `services/`, `lib/`, `middleware/`) and an **empty scaffold** for a future domain-driven layout (`modules/{auth,products,recommendations,tryon}/`, `core/`, `infrastructure/`, `shared/` — currently just `.gitkeep` files). When adding backend features, extend the active `routes/`/`services/`/`lib/` set unless you're deliberately migrating a module into the new structure.

### Data model (`backend/api/prisma/schema.prisma`)
Postgres via Prisma. Key models: `User` (with 1:1 `CustomerProfile` for shipping/consent data), `RefreshToken` (hashed, indexed by user), `Product`, `Recommendation`/`RecommendationItem`, `MakeupTryOnSession`. Passwords are bcrypt-hashed; refresh tokens are stored as SHA-256 hashes, never raw.

### Frontend ↔ Mobile: hybrid WebView bridge
`frontend/` is not just a standalone SPA — it also runs **inside the Flutter app's WebView** and talks to native code over a versioned postMessage bridge:
- Web side: `frontend/src/bridge/glowlab-bridge.ts` (`GlowLabBridgeClient`). `isNative` is true only when `window.GlowLabBridgeChannel.postMessage` exists (i.e., running inside the Flutter WebView); the same code must degrade gracefully when run standalone in a normal browser.
- Native side: `mobile/lib/src/hybrid/bridge/` — `bridge_dispatcher.dart` routes messages by `type` to individual handlers in `bridge/handlers/` (location, pick image, share, push token, logout, download, notifications, ping, open external link, auth-updated).
- Any new bridge message type needs a matching handler on both sides and a protocol version bump if the payload shape changes.

### Mobile app (`mobile/`, Flutter + Riverpod + go_router + Hive)
- Entry: `lib/main.dart` → `Hive.initFlutter()` + open boxes synchronously before first frame → `runApp(ProviderScope(GlowLabApp()))`.
- Routing: `lib/src/router/app_router.dart`, a `StatefulShellRoute.indexedStack` with 5 tabs (`/inicio`, `/catalogo`, `/ar`, `/carrito`, `/influencers`) plus root-stack routes (`/producto/:id`, `/settings`) using `parentNavigatorKey` so they escape the shell.
- State: Riverpod providers, notably `cartProvider` (persists to Hive as JSON), `catalogQueryProvider`/`filteredProductsProvider` (derived filtering over seed data), `recommendationsProvider` (network + fallback), `restClientProvider` (owns the `http.Client` lifecycle).
- Persistence: Hive box `prefs` for cart, last-used look, and settings — see `lib/src/storage/hive_boxes.dart`.
- Platform capability access is behind small facades in `lib/src/platform/` (camera, connectivity, location, notifications, permissions, gallery, share, link) — implement against these interfaces rather than calling plugins directly, so the WebView bridge handlers and native screens share one code path.
- Product/catalog data currently comes from static seeds (`lib/src/data/products_seed.dart`, `influencers_seed.dart`) — real usage should replace these with a repository backed by the API, not inline HTTP calls in widgets.
- Build-time API target: `--dart-define=API_BASE=...`, read in `lib/src/providers/api_providers.dart`.

### Security posture (backend)
`helmet`, disabled `x-powered-by`, strict JSON body parsing with a size limit, blocking of `__proto__`/`constructor`/`prototype` keys (prototype-pollution guard), layered rate limits (global / auth / heavy routes like try-on), bcrypt password hashing (12 rounds), and a unified error handler that normalizes Zod/Multer/Prisma/domain (`HttpError`) errors with a `requestId` for tracing. See `backend/api/SECURITY_HARDENING.md`.
