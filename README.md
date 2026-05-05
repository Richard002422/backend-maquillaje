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

### Web Vite (raíz)

```bash
npm install
npm run dev
```

## Estructura

| Ruta | Contenido |
|------|-----------|
| `mobile/` | App Flutter |
| `backend/` | API Gateway (Nginx) + API Express + servicio FastAPI (IA) — ver [`backend/README.md`](./backend/README.md) |
| `src/` | TypeScript + estilos (Vite) |
| `docs/` | Documentación técnica |
