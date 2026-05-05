# Estructura de carpetas (Node.js API)

Estructura sugerida y ya creada como base para evolucionar el servicio:

```text
backend/api/
├── prisma/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/            # Carga y validacion de configuracion/env
│   ├── core/              # Inicializacion, bootstrap y piezas base
│   ├── modules/           # Dominios funcionales
│   │   ├── auth/
│   │   ├── products/
│   │   ├── recommendations/
│   │   └── tryon/
│   ├── infrastructure/    # Integraciones externas (DB, AI, storage, etc.)
│   ├── shared/            # Utilidades y contratos compartidos
│   ├── tests/             # Tests unitarios/integracion/e2e
│   ├── lib/               # Implementacion actual reutilizable
│   ├── middleware/        # Middleware HTTP actual
│   ├── routes/            # Rutas HTTP actuales
│   ├── services/          # Servicios de aplicacion actuales
│   └── types/             # Tipos globales
└── ...
```

## Nota de migracion

La estructura nueva convive con la implementacion actual para evitar romper imports.
Se puede migrar modulo por modulo desde `routes/` y `services/` hacia `modules/`.
