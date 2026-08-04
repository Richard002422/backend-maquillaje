# Paso 3 — Permisos nativos por capability

## Objetivo

Reemplazar `PermissionServiceStub` por `PermissionService` real y declarar
permisos Android compatibles con API 24–35 (Android 10 → 14+).

## Decisiones

| Tema | Elección | Por qué |
|---|---|---|
| Plugin | `permission_handler` (ya en pubspec) | API unificada; mapea bien API 33+ |
| Momento del request | Bajo demanda (`ensure*`) | Evita rechazo en Play y fatiga de permisos |
| Fotos | `Permission.photos` + fallback `storage` | Android 13 vs ≤12 |
| Ubicación | `locationWhenInUse` | No background location (más sensible para Play) |
| Notificaciones | Declarar `POST_NOTIFICATIONS`; pedir solo al probar/usar push | Android 13+ |
| Cámara hardware | `uses-feature required=false` | App usable en tablets sin cámara |

## Cómo verificar

```bash
cd mobile
flutter run --flavor dev --dart-define-from-file=config/dev.json
```

1. Abre **Ajustes** (ruta `/settings` desde la app).
2. Pulsa **Cámara**, **Galería**, **Ubicación**, **Notificaciones**.
3. Acepta/deniega el diálogo del sistema.
4. Debes ver SnackBar `concedido` / `denegado` (+ acción Ajustes si permanente).

## Criterio de OK

- Diálogos nativos aparecen al tocar cada fila.
- `flutter analyze` limpio.
- AR existente sigue pudiendo pedir cámara (flujo previo intacto).
- Sin WebView todavía (Paso 4).

## Advertencia Play / privacidad

Declarar ubicación y notificaciones **antes** de usarlas en UI de producto
obliga a justificarlas en el formulario de Play Console. En Paso 9 (GPS/FCM)
documentaremos el uso en Data safety. Mientras tanto solo se prueban desde Ajustes.
