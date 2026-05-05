# 04 — Cliente web estático (Vite + TypeScript)

## 4.1 Rol en el ecosistema

El proyecto en la **raíz del repositorio** (`package.json`, `src/`, `index.html`) es una **SPA ligera** pensada para:

- Landing de marketing o **panel externo** (alineado con la decisión de stack: React/Vite separado del núcleo Flutter si se migra a React).
- Prototipo rápido de **prueba virtual por imagen** (subida local + simulación de IA mediante mensajes en UI).

No comparte runtime con Flutter; cualquier lógica de negocio duplicada debe **converger hacia la API REST** para evitar bifurcación de reglas.

## 4.2 Toolchain

| Artefacto | Descripción |
|-----------|-------------|
| `package.json` | Scripts `dev`, `build`, `preview`; dependencias `vite`, `typescript`. |
| `tsconfig.json` | Modo estricto bundler, ES2023 + DOM. |
| `index.html` | Punto de montaje `#app`, meta `lang="es"`. |

Comandos:

```bash
npm install
npm run dev       # servidor de desarrollo Vite
npm run build     # tsc && vite build → salida en dist/
npm run preview   # sirve dist/ para validación pre-producción
```

## 4.3 Estructura del código fuente

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/main.ts` | Inyección de plantilla HTML principal, wiring de eventos (chips, subida de archivo, toast, scroll). |
| `src/data.ts` | Datos estáticos: looks (`LOOKS`) y productos (`PRODUCTS`) para maquetación. |
| `src/style.css` | Design system (tipografías Google importadas en CSS, variables, layout responsive). |

## 4.4 Flujo de UI (implementación actual)

1. **Montaje:** sustitución de `innerHTML` del nodo `#app` con secciones semánticas (`header`, `main`, `footer`).
2. **Prueba virtual:** `<input type="file" accept="image/*">` superpuesto sobre zona de drop; vista previa con `URL.createObjectURL`.
3. **Estilos:** chips con clase `chip--active`; sincronización con tarjetas de looks (“Usar en prueba”).
4. **Feedback:** elemento `#toast` con clase `toast--visible` para mensajes transitorios.

## 4.5 Puntos de extensión hacia IA real

| Punto | Implementación sugerida |
|-------|-------------------------|
| Subida de imagen | `FormData` + `POST /v1/try-on` multipart; respuesta con URL de imagen compuesta o mapa de máscaras. |
| Autenticación | Cabecera `Authorization: Bearer` si el panel es para staff o usuarios logados. |
| SSR/SEO | Si el marketing requiere SEO fuerte, valorar **Astro/Next** o **prerender** de rutas críticas; Vite SPA pura indexa peor sin hidratar metadatos por ruta. |

## 4.6 Despliegue web

El artefacto `dist/` es **estático** (HTML, JS, CSS). Opciones habituales:

- **Object storage + CDN** (S3 + CloudFront, Azure Static Web Apps, Cloudflare Pages).
- **Headers de caché:** `index.html` con `Cache-Control: no-cache`; assets con hash (`immutable`).

## 4.7 Coexistencia con Flutter Web

| Criterio | Vite (raíz) | Flutter Web (`mobile/`) |
|----------|-------------|-------------------------|
| Tamaño inicial | Suele ser menor para landing | Mayor payload engine CanvasKit/Skwasm |
| Integración nativa AR | Navegador: WebGL/WebRTC según stack | Depende de plugins y `--web-renderer` |
| Equipo | Front web JS/TS | Mobile Dart compartido con stores |

Documente en el **runbook de producto** cuál es la entrada pública principal (`www` vs `app`).
