# Paso 4 — WebView host (`frontend/` Vite)

## Objetivo

Cargar el SPA real (`frontend/`) dentro de Flutter con `webview_flutter`.
Sin bridge JS todavía (Paso 5).

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| Package | `webview_flutter` | Oficial; acordado en Paso 0 |
| URL | `AppConfig.webBaseUrl` (`config/dev.json` → `http://10.0.2.2:5173`) | Misma fuente que flavors |
| Entrada UI | Botón en Inicio + Ajustes → ruta `/web` | No reemplaza aún el shell nativo (migración gradual) |
| Back | Historial WebView primero, luego `pop` | UX Android correcta |
| Mixed content | `alwaysAllow` solo en `dev` | HTTP Vite; prod queda estricto |

## Cómo verificar

Terminal 1 — frontend:
```bash
cd frontend
npm run dev
```

Terminal 2 — Flutter:
```bash
cd mobile
flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. En **Inicio** pulsa **Abrir producto web (Paso 4)** (o Ajustes → WebView).
2. Debes ver **GlowLab — Tu edición personalizada** (no el prototipo de la raíz).
3. El back del sistema navega atrás en la web; si no hay historial, cierra la pantalla.

## Criterio de OK

- WebView carga el frontend.
- Error visible si Vite no está corriendo (mensaje + Reintentar).
- `flutter analyze` limpio.
- Bridge aún no existe (Paso 5).

## Advertencias

- Emulador: `10.0.2.2` = localhost del PC. Dispositivo físico: IP LAN + Vite con `--host 0.0.0.0`.
- Rendimiento: Texture Layer Hybrid Composition por defecto; si ves jank, evaluar Hybrid Composition en Paso posteriores.
- Seguridad: no inyectar tokens hasta Paso 6 (Secure Storage + AUTH_SYNC).
