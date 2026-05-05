# Seguridad, validacion y manejo de errores

Controles implementados en API:

- `helmet` con cabeceras de seguridad y politica de referrer.
- `x-powered-by` deshabilitado.
- Validacion estricta de JSON (`strict: true`) y limite configurable de payload (`API_JSON_LIMIT`).
- Bloqueo de claves peligrosas (`__proto__`, `constructor`, `prototype`) para mitigar prototype pollution.
- Rate limiting por capas:
  - global (`RATE_LIMIT_MAX`)
  - auth (`RATE_LIMIT_AUTH_MAX`)
  - rutas pesadas (`RATE_LIMIT_HEAVY_MAX`) en `try-on` y `realtime`.
- Validacion fuerte de password en registro (longitud + mayuscula + minuscula + numero).
- Hashing seguro:
  - passwords con `bcrypt` (`ROUNDS=12`)
  - refresh tokens opacos almacenados como SHA-256.
- Manejo unificado de errores:
  - Zod
  - Multer
  - Prisma
  - errores de dominio (`HttpError`)
  - `requestId` incluido en respuestas para trazabilidad.
