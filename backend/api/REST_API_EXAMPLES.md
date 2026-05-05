# REST API completa (ejemplos reales)

Base URL local (gateway): `http://localhost:8080/v1`

## 1) Auth

### Registro

```bash
curl -X POST "http://localhost:8080/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@example.com",
    "password": "AnaSuperSecreta123"
  }'
```

Respuesta esperada:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh_token>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### Login

```bash
curl -X POST "http://localhost:8080/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@example.com",
    "password": "AnaSuperSecreta123"
  }'
```

### Refresh

```bash
curl -X POST "http://localhost:8080/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'
```

## 2) Perfil de usuario

### Ver perfil

```bash
curl "http://localhost:8080/v1/users/me/profile" \
  -H "Authorization: Bearer <jwt>"
```

### Actualizar perfil

```bash
curl -X PATCH "http://localhost:8080/v1/users/me/profile" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ana",
    "lastName": "Lopez",
    "skinTone": "light-medium",
    "skinType": "mixta",
    "preferredStyles": ["clean-girl", "soft-glam"]
  }'
```

### Actividad del usuario

```bash
curl "http://localhost:8080/v1/users/me/activity" \
  -H "Authorization: Bearer <jwt>"
```

## 3) Productos

### Listado filtrado

```bash
curl "http://localhost:8080/v1/products?q=glow&category=Rostro&maxPrice=40&page=1&pageSize=12"
```

### Detalle por ID

```bash
curl "http://localhost:8080/v1/products/serum-brillo"
```

## 4) Recomendaciones

### Obtener recomendaciones (GET)

```bash
curl "http://localhost:8080/v1/recommendations?look=clean-girl&cart=base-hd,rubor-crema&limit=5" \
  -H "Authorization: Bearer <jwt>"
```

Respuesta esperada:

```json
{
  "recommendationId": "cmab1234...",
  "source": "ai",
  "productIds": ["serum-brillo", "rubor-crema", "iluminador"],
  "products": [
    { "id": "serum-brillo", "name": "Sérum brillo 24h", "category": "Skincare", "priceEur": 32 }
  ]
}
```

### Crear recomendación (POST)

```bash
curl -X POST "http://localhost:8080/v1/recommendations" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "look": "soft-glam",
    "cartProductIds": ["labial-velvet", "base-hd"],
    "limit": 6
  }'
```

### Historial de recomendaciones

```bash
curl "http://localhost:8080/v1/recommendations/history?limit=10" \
  -H "Authorization: Bearer <jwt>"
```

## 5) Try-on virtual

### Ejecutar try-on (multipart)

```bash
curl -X POST "http://localhost:8080/v1/try-on" \
  -H "Authorization: Bearer <jwt>" \
  -F "lookId=soft-glam" \
  -F "image=@C:/tmp/selfie.jpg"
```

Respuesta esperada:

```json
{
  "sessionId": "cmab5678...",
  "previewUrl": "https://cdn.example.com/preview.jpg",
  "maskUrls": {
    "lips": "https://cdn.example.com/mask-lips.png"
  },
  "latencyMs": 842,
  "note": "Render generado por servicio IA"
}
```

### Historial de try-on

```bash
curl "http://localhost:8080/v1/try-on/history?limit=10" \
  -H "Authorization: Bearer <jwt>"
```

### Detalle de sesión try-on

```bash
curl "http://localhost:8080/v1/try-on/<sessionId>" \
  -H "Authorization: Bearer <jwt>"
```

## 6) Salud

```bash
curl "http://localhost:8080/health"
curl "http://localhost:8080/v1/health"
```

## 7) Realtime (frame por frame)

```bash
curl -X POST "http://localhost:8080/v1/realtime/process-frame" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "frameBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "lookId": "soft-glam"
  }'
```
