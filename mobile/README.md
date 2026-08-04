# glowlab_mobile

Cliente **Flutter** (shell Android + nativo). Producto web: `../frontend/` (Vite).

## Paso actual: 10 (producción)

Ver [`docs/PASO10_PRODUCCION.md`](docs/PASO10_PRODUCCION.md)

## Desarrollo

```bash
cd frontend && npm run dev
cd mobile && flutter run --flavor dev --dart-define-from-file=config/dev.json
```

## Release AAB (prod)

1. Generar keystore: `pwsh ./scripts/create_release_keystore.ps1`
2. Editar `android/key.properties`
3. Build:

```bash
flutter build appbundle --flavor prod --dart-define-from-file=config/prod.json --release
```
