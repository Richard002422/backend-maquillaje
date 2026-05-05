# Estructura de carpetas (FastAPI AI)

Estructura sugerida y creada como base para evolucionar el servicio de IA:

```text
backend/ai-service/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── deps.py
│   ├── schemas.py
│   ├── routers/           # Rutas actuales activas
│   ├── logic/             # Logica actual de recomendaciones/try-on
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/ # Endpoints versionados por dominio
│   ├── core/              # Config central, seguridad, logging
│   ├── services/          # Casos de uso y orquestacion
│   ├── repositories/      # Acceso a datos/modelos externos
│   ├── models/            # Entidades internas/modelos de dominio
│   └── tests/             # Tests unitarios/integracion
└── ...
```

## Nota de migracion

La estructura nueva convive con `routers/` y `logic/` actuales para evitar regresiones.
Se recomienda mover funcionalidad por etapas hacia `api/`, `services/` y `core/`.
