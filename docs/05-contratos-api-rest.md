# 05 — Contratos API REST

## 5.1 Principios

- **JSON** en cuerpo y respuestas salvo endpoints binarios (p. ej. subida de imagen).
- **Versionado por prefijo** de ruta: `/v1/...` (el cliente actual usa `/v1/recommendations` en el intento principal).
- **Errores:** cuerpo JSON con `code`, `message`, `details` opcional; códigos HTTP semánticos (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`).

## 5.2 Base URL y autenticación

- **Flutter:** `String.fromEnvironment('API_BASE', defaultValue: 'https://api.example.com')` en `lib/src/providers/api_providers.dart`.
- **Compilación:** `flutter build apk --dart-define=API_BASE=https://api.prod.example.com`

Cabeceras recomendadas en cliente:

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <token>   # si aplica
X-Client-Version: 0.1.0+1
X-Platform: android | ios | web
```

## 5.3 Endpoint: recomendaciones (implementado en cliente)

**`GET /v1/recommendations`**

### Respuesta esperada (éxito `200`)

```json
{
  "productIds": ["serum-brillo", "base-hd", "paleta-atardecer"]
}
```

- `productIds`: array de strings alineados con los `id` del catálogo del servidor (y coherentes con los del cliente tras sincronización).

### Comportamiento del cliente (`recommendations_provider.dart`)

1. Invoca `RestClient.getJson('/v1/recommendations')`.
2. Si la respuesta es válida y `productIds` no vacío, mapea a objetos `Product` locales.
3. Si **cualquier error** (red, DNS, 4xx/5xx, JSON inválido), cae a **heurística offline** usando `lastLookIdProvider` + contenido del carrito.

### Evolución recomendada

Soportar personalización explícita:

```http
GET /v1/recommendations?look=natural&skin_tone=medium&limit=8
```

## 5.4 Endpoint sugerido: try-on (no implementado aún en cliente)

**`POST /v1/try-on`** (multipart)

| Parte | Tipo | Descripción |
|-------|------|-------------|
| `image` | file | Fotograma o selfie JPEG/PNG. |
| `lookId` | string | Identificador de look comercial. |
| `deviceProfile` | JSON string opcional | Info de rendimiento para elegir modelo liviano/pesado. |

**Respuesta `200`:**

```json
{
  "previewUrl": "https://cdn.../preview.jpg",
  "maskUrls": { "lips": "...", "eyes": "..." },
  "latencyMs": 420
```

## 5.5 Catálogo, navegación y búsqueda (Clase → Categoría → Producto)

Implementado en `backend/api/src/routes/{classes,products,adminClasses,adminCategories}.ts`.
Modelo conceptual: una **Clase** (Ojos, Rostro, Labios, Skincare, Tintes — nivel del
menú deslizable) agrupa **Categorías** (Sombra de ojos, Primer... — nivel de la
tira horizontal), y cada **Producto** pertenece opcionalmente a una Categoría.
Administrable desde el panel admin (Lumina, externo a este repo) vía los
endpoints `/v1/admin/classes` y `/v1/admin/categories`.

**`GET /v1/classes`** — clases activas, para el menú deslizable.

```json
{ "items": [{ "id": "class_ojos", "name": "Ojos", "slug": "ojos", "icon": "👁️", "displayOrder": 10 }] }
```

**`GET /v1/classes/:classSlug/categories`** — categorías de una clase, para la
tira horizontal. Siempre antepone una pestaña **sintética** `mas-vendidos`
(`isSynthetic: true`, no es una fila real — ver `lib/catalogTaxonomy.ts`).

```json
{
  "class": { "id": "class_ojos", "name": "Ojos", "slug": "ojos", "icon": "👁️", "displayOrder": 10 },
  "items": [
    { "id": null, "name": "Más vendidos", "slug": "mas-vendidos", "displayOrder": -1, "isSynthetic": true },
    { "id": "cat_ojos_sombra", "name": "Sombra de ojos", "slug": "sombra-de-ojos", "displayOrder": 10, "isSynthetic": false }
  ]
}
```

**`GET /v1/products`** — paginado y filtrado en servidor (el cliente ya NO trae
todo el catálogo a memoria para este flujo, ver `frontend/src/catalogTaxonomy.ts`).

Query params: `q`, `category` (legado, string libre), `classSlug`, `categorySlug`
(usar `mas-vendidos` para bestsellers), `maxPrice`, `page`, `pageSize` (máx. 100).
Cada producto de la respuesta incluye `taxonomy` (`null` si es un producto legado
sin categoría asignada todavía):

```json
{
  "items": [{
    "id": "…", "name": "…", "category": "Ojos",
    "taxonomy": {
      "classId": "class_ojos", "classSlug": "ojos", "className": "Ojos",
      "categoryId": "cat_ojos_sombra", "categorySlug": "sombra-de-ojos", "categoryName": "Sombra de ojos"
    }
  }],
  "page": 1, "pageSize": 24, "total": 137
}
```

**Endpoints admin** (`X-Admin-Token`, mismo mecanismo que `/v1/admin/products`):
`GET/POST /v1/admin/classes`, `PATCH /v1/admin/classes/:id`,
`PATCH /v1/admin/classes/reorder`, `DELETE /v1/admin/classes/:id` (solo si no
tiene categorías); `GET/POST /v1/admin/classes/:classId/categories`,
`PATCH /v1/admin/categories/:id`, `PATCH /v1/admin/categories/reorder`,
`DELETE /v1/admin/categories/:id` (solo si no tiene productos asignados).
`POST/PATCH /v1/admin/products` acepta `catalogCategoryId` para asignar la
categoría de un producto (además del `category` string legado, que se
mantiene por compatibilidad).

## 5.6 Endpoint sugerido: checkout

Delegación en **PSP** (Stripe, Adyen, Redsys, etc.): el cliente solo debe recibir `clientSecret` o URL de sesión; **no** almacenar PAN/CVV.

## 5.7 Cliente HTTP interno

`RestClient` (`lib/src/services/rest_client.dart`):

- Construye URI absoluta: `baseUrl + path`.
- `getJson` / `postJson` lanzan `RestException` con `statusCode` y `body` bruto para logging.

**Mejoras de producción:** timeouts (`http.Client` con `IOClient` + `HttpClient.connectionTimeout`), reintentos idempotentes, telemetría OpenTelemetry.

## 5.8 OpenAPI

Se recomienda publicar **OpenAPI 3.1** en `/v1/openapi.json` o repositorio de contratos para generar DTOs en Dart (`openapi_generator`) y reducir deriva.

## 5.9 Implementación de referencia en el monorepo

La API **Node + Express** y el microservicio **FastAPI** descritos de forma operativa (rutas, variables, Docker) viven en [`backend/README.md`](../backend/README.md). Los contratos de `/v1/recommendations` y try-on allí documentados son la fuente de verdad para alinear clientes Flutter y web.
