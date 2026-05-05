# Database Design (PostgreSQL)

El diseno del servicio `api` se implementa en `schema.prisma` con PostgreSQL.

## Modelos principales

- `User`: cuenta de usuario, preferencias de maquillaje y perfil de piel.
- `RefreshToken`: sesiones de autenticacion con refresh token opaco.
- `Product`: catalogo de productos con metadata para recomendacion.
- `Recommendation`: solicitud/respuesta de recomendacion por usuario o anonima.
- `RecommendationItem`: ranking de productos sugeridos por recomendacion.
- `MakeupTryOnSession`: historial de pruebas virtuales (try-on) por usuario.
- `TryOnAsset`: archivos derivados de una sesion (preview, mascara, etc.).

## Relaciones clave

- `User 1:N RefreshToken`
- `User 1:N Recommendation`
- `Recommendation 1:N RecommendationItem`
- `Product 1:N RecommendationItem`
- `User 1:N MakeupTryOnSession`
- `Product 1:N MakeupTryOnSession` (opcional)
- `MakeupTryOnSession 1:N TryOnAsset`

## Consideraciones

- `provider = "postgresql"` en Prisma.
- Se usan enums `RecommendationStatus` y `TryOnStatus`.
- Se anaden indices para consultas por usuario y fecha en historial.
- Seed incluye datos demo de productos, una recomendacion y una sesion de try-on.
