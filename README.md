# GlowLab — aplicación de maquillaje asistida por IA

Monorepo con **cliente Flutter** (Android, iOS, Web) y **SPA web** (Vite + TypeScript) para marketing o panel ligero.

## Documentación técnica

La documentación de arquitectura, APIs, AR/IA, seguridad y despliegue está en **[`docs/README.md`](./docs/README.md)**.

## Inicio rápido

### App Flutter (`mobile/`)

```bash
cd mobile
flutter pub get
flutter run
```

Compilar con API de producción:

```bash
flutter build apk --dart-define=API_BASE=https://api.tu-dominio.com
```

### Frontend web Vite (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

API del frontend (archivo `.env`):

```bash
VITE_API_BASE_URL=http://localhost:8080
```

### Backend API Node (`backend/api/`)

```bash
cd backend/api
npm install
npm run dev
```

## Estructura

| Ruta | Contenido |
|------|-----------|
| `mobile/` | App Flutter |
| `backend/` | Backend (gateway/API/IA), independiente del frontend — ver [`backend/README.md`](./backend/README.md) |
| `frontend/` | Frontend web (Vite + TypeScript) |
| `docs/` | Documentación técnica |
# app-maquillaje-frontend
