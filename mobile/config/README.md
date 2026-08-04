# Config compile-time (dart-define-from-file)

| Archivo | Uso |
|---------|-----|
| `dev.json` | Emulador Android → `10.0.2.2` (localhost del host) |
| `prod.json` | Placeholders HTTPS de producción |

```bash
flutter run --flavor dev --dart-define-from-file=config/dev.json
flutter run --flavor prod --dart-define-from-file=config/prod.json
```

Claves requeridas: `APP_FLAVOR`, `API_BASE`, `WEB_BASE_URL`.
