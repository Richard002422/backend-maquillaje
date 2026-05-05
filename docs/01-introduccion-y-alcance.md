# 01 — Introducción y alcance

## 1.1 Propósito del sistema

El ecosistema **GlowLab** (nombre de producto usado en la UI) agrupa capacidades de **comercio de maquillaje** con **asistencia por IA** y **prueba virtual (AR / visión por computador)**. El objetivo de negocio es reducir fricción en la decisión de compra mediante:

- Vista previa de looks y productos.
- Recomendaciones contextualizadas (servidor o heurística local).
- Catálogo filtrable y carrito persistente.
- Integración con contenido de influencers (enlaces profundos a redes).

## 1.2 Superficies de software

| Superficie | Tecnología | Plataformas | Rol |
|------------|------------|-------------|-----|
| Cliente núcleo | Flutter (`mobile/`) | **Android**, **iOS**, **Web** (`flutter build web`) | App principal: catálogo, carrito, AR con cámara (móvil), persistencia local, llamadas REST. |
| Cliente web complementario | Vite + TypeScript (raíz) | **Web** (estático) | Landing / prototipo de prueba virtual por foto y catálogo demo; pensado como **panel o marketing** separado del binario Flutter. |

> **Nota de arquitectura:** coexisten dos “webs”: el artefacto **Flutter Web** (mismo código que móvil, con limitaciones de plugins nativos) y la **SPA Vite** en la raíz. En producción conviene **hosting y dominios distintos** o rutas bajo path prefix (`/app` vs `/`) para no duplicar SEO ni cookies.

## 1.3 Estado de implementación (código actual)

- **Flutter:** funcionalidades de producto implementadas a nivel de **UI + estado + persistencia**; AR con **cámara en vivo** y guía facial **estática**; motor de landmarks / segmentación **pendiente de integración** (ML Kit o MediaPipe).
- **Recomendaciones IA:** `FutureProvider` con intento HTTP y **fallback heurístico** local.
- **Backend:** no incluido en el repo; el cliente asume **API REST** documentada en el capítulo 05.
- **Web Vite:** flujo de foto + estilos + toast simulado; sin backend acoplado.

## 1.4 Actores

- **Usuario final:** navega catálogo, AR, carrito y enlaces a redes.
- **Sistema de recomendación / IA:** servicio HTTP (o modelo on-device en evolución).
- **Operaciones:** despliegue de API, CDN de imágenes, analítica y feature flags.

## 1.5 Glosario breve

- **AR (try-on):** superposición de maquillaje virtual sobre imagen o vídeo; aquí basado en **cámara + procesamiento por frame**.
- **REST:** API HTTP con JSON; el cliente usa `GET`/`POST` y códigos de estado estándar.
- **Provider (Riverpod):** unidad de estado reactivo y testable en Flutter.
