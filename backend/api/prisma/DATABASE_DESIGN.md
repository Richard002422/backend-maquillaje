# Database Design (PostgreSQL)

El diseno del servicio `api` se implementa en `schema.prisma` con PostgreSQL.

## Modelos principales

- `User`: cuenta, autenticación (email, `passwordHash`), datos personales (`firstName`, `lastName`, `phone`), `passwordChangedAt` y preferencias de maquillaje.
- `CustomerProfile`: datos de la pantalla **Editar perfil** — dirección de envío, aceptación de términos y `completedAt` (perfil listo para desbloquear funciones). Relación 1:1 con `User`.
- `RefreshToken`: sesiones de autenticacion con refresh token opaco.
- `Product`: catálogo relacional (`products`) — id UUID, nombre, precio NUMERIC, descripción, categoría, stock, URL de imagen.
- `Recommendation`: solicitud/respuesta de recomendacion por usuario o anonima.
- `RecommendationItem`: ranking de productos sugeridos por recomendacion.
- `MakeupTryOnSession`: historial de pruebas virtuales (try-on) por usuario.
- `TryOnAsset`: archivos derivados de una sesion (preview, mascara, etc.).

## Relaciones clave

- `User 1:1 CustomerProfile`
- `User 1:N RefreshToken`
- `User 1:N Recommendation`
- `Recommendation 1:N RecommendationItem`
- `Product 1:N RecommendationItem`
- `User 1:N MakeupTryOnSession`
- `Product 1:N MakeupTryOnSession` (opcional)
- `MakeupTryOnSession 1:N TryOnAsset`

## Pantalla Editar perfil → tablas

| Campo del formulario | Tabla / columna |
| --- | --- |
| Nombre | `User.firstName` |
| Apellidos | `User.lastName` |
| Email | `User.email` |
| Teléfono | `User.phone` |
| Contraseña | `User.passwordHash` (+ `User.passwordChangedAt`) |
| Dirección | `CustomerProfile.addressLine` |
| Ciudad | `CustomerProfile.city` |
| Código postal | `CustomerProfile.postalCode` |
| País | `CustomerProfile.country` |
| Acepto términos | `CustomerProfile.acceptsTerms`, `acceptsTermsAt`, `termsVersion` |
| Perfil completo | `CustomerProfile.completedAt` |

## Migraciones

```bash
cd backend/api
npm run db:migrate        # aplica migraciones pendientes (producción/CI)
npx prisma migrate dev    # desarrollo: crea y aplica nuevas migraciones
```

Migración inicial del perfil de cliente: `20260617120000_add_customer_profile`.
Migración catálogo relacional: `20260618120000_products_relational`.

## Tabla `products`

| Columna | Tipo PostgreSQL | Descripción |
| --- | --- | --- |
| `id` | UUID (PK) | Identificador del producto |
| `name` | VARCHAR(255) | Nombre |
| `price` | NUMERIC(12,2) | Precio en EUR |
| `description` | TEXT | Descripción |
| `category` | VARCHAR(120) | Categoría |
| `stock` | INTEGER | Inventario |
| `image_url` | TEXT | URL de la imagen (S3 u otra) |
| `created_at` | TIMESTAMP | Alta |
| `updated_at` | TIMESTAMP | Última modificación |

## Consideraciones

- `provider = "postgresql"` en Prisma.
- Se usan enums `RecommendationStatus` y `TryOnStatus`.
- Se anaden indices para consultas por usuario y fecha en historial.
- Seed incluye datos demo de productos, una recomendacion y una sesion de try-on.
