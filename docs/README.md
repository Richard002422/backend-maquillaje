# Documentación técnica — GlowLab / maquillaje asistido por IA

Documentación orientada a equipos de ingeniería, arquitectura y operaciones. El nivel es **avanzado**; cada capítulo enlaza conceptos con rutas reales del repositorio.

## Mapa de lectura

| Documento | Contenido |
|-------------|-----------|
| [01 — Introducción y alcance](./01-introduccion-y-alcance.md) | Propósito del producto, plataformas, actores y límites del estado actual del código. |
| [02 — Arquitectura y repositorio](./02-arquitectura-y-repositorio.md) | Monorepo, diagramas lógicos, dependencias entre artefactos y despliegues. |
| [03 — Cliente Flutter](./03-cliente-flutter.md) | App núcleo: navegación, estado, persistencia, módulos funcionales, rutas y build por plataforma. |
| [04 — Cliente web (Vite + TypeScript)](./04-cliente-web-vite.md) | SPA estática: estructura, assets, puntos de extensión para IA y panel. |
| [05 — Contratos API REST](./05-contratos-api-rest.md) | Endpoints esperados, payloads, errores y estrategia de versionado. |
| [06 — AR, visión por computador e IA](./06-ar-vision-e-ia.md) | Pipeline de medios, cámara, ML Kit/MediaPipe, recomendaciones y web. |
| [07 — Persistencia y modelo de datos local](./07-persistencia-y-datos-locales.md) | Hive, claves, serialización del carrito y extensión a Isar. |
| [08 — Seguridad, privacidad y cumplimiento](./08-seguridad-y-privacidad.md) | Datos biométricos/imagen, transporte, almacenamiento y checklist GDPR-like. |
| [09 — Build, entornos y despliegue](./09-build-despliegue-y-entornos.md) | Flutter (Android, iOS, Web), variables de entorno, CI/CD y hosting estático. |
| [10 — Pruebas, calidad y evolución](./10-pruebas-calidad-y-evolucion.md) | Estrategia de tests, analizador, deuda técnica conocida y roadmap técnico. |
| [Anexo — Rutas y componentes](./ANEXO-rutas-y-componentes.md) | Tablas de referencia: rutas GoRouter, providers, anclas web, comandos. |

## Ubicación rápida en el código

- **Flutter (Android, iOS, Web desde el mismo proyecto):** `mobile/`
- **Web marketing / panel ligero (Vite):** raíz del repo (`src/`, `index.html`, `package.json`)

## Convenciones

- Las rutas de archivos se expresan relativas a la raíz del repositorio salvo indicación contraria.
- Los fragmentos de protocolo API son **prescriptivos** para integración; el backend puede versionarse con prefijo `/v1`.
