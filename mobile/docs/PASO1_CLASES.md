# Paso 1 — Clases y objetos creados

## core/

| Clase | Rol |
|---|---|
| `AppConfig` | Lee `API_BASE`, `WEB_BASE_URL`, `APP_FLAVOR` vía `--dart-define` |
| `Failure` (+ subtypes) | Errores de dominio tipados |
| `Result` / `Success` / `Err` | Resultado sin excepciones en happy path |
| `AppLogger` | Logging filtrable por flavor |

## domain/

| Contrato | Rol |
|---|---|
| `IPermissionService` | Permisos por capability |
| `ITokenStore` | JWT cifrado (contrato) |
| `IDeviceCapabilityGateway` | Orquestación de capacidades |
| `GeoPoint` | Entidad de ubicación mínima |

## data/

| Clase | Rol |
|---|---|
| `InMemoryTokenStore` | Stub inseguro (solo DI Paso 1) |
| `DeviceCapabilityGatewayStub` | Devuelve `Err` controlados |

## platform/ (stubs)

| Clase | Capability futura |
|---|---|
| `PermissionServiceStub` | permission_handler (Paso 3) |
| `CameraServiceStub` | captura puntual (Paso 7) |
| `GalleryServiceStub` | galería (Paso 7) |
| `LocationServiceStub` | GPS (Paso 9) |
| `NotificationServiceStub` | FCM (Paso 9) |
| `ShareServiceStub` | share (Paso 8) |
| `FileServiceStub` | descargas/archivos (Paso 8) |
| `LinkServiceStub` | enlaces externos (Paso 8) |
| `ConnectivityServiceStub` | red (Paso 8) |

## hybrid/

| Clase | Rol |
|---|---|
| `BridgeMessage` | DTO JSON versionado |
| `BridgeMessageTypes` | Constantes del protocolo v1 |
| `IBridgeMessenger` | Puerto F↔JS |
| `InMemoryBridgeMessenger` | Stub hasta WebView |
| `IBridgeMessageHandler` | OCP por tipo de mensaje |
| `PingHandler` | PING → PONG |
| `BridgeDispatcher` | Enruta handlers |
| `WebViewHostPlaceholder` | Marcador Paso 4 |

## di / presentation

| Clase | Rol |
|---|---|
| `hybrid_providers.dart` | Riverpod del host híbrido |
| `WebHostScreenStub` | UI placeholder no enrutada |

## Android

| Cambio | Valor |
|---|---|
| `applicationId` / namespace | `com.glowlab.app` |
| `minSdk` / `targetSdk` | 24 / 35 |
| `MainActivity` | `com.glowlab.app.MainActivity` |
| `key.properties.example` | Plantilla (sin secretos) |
