import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import '../core/logging/app_logger.dart';
import '../data/datasources/secure_token_store.dart';
import '../data/repositories/device_capability_gateway_stub.dart';
import '../domain/repositories/device_capability_gateway.dart';
import '../domain/repositories/permission_repository.dart';
import '../domain/repositories/token_store.dart';
import '../hybrid/bridge/bridge_contract.dart';
import '../hybrid/bridge/bridge_dispatcher.dart';
import '../hybrid/bridge/handlers/auth_updated_handler.dart';
import '../hybrid/bridge/handlers/download_handler.dart';
import '../hybrid/bridge/handlers/get_location_handler.dart';
import '../hybrid/bridge/handlers/get_push_token_handler.dart';
import '../hybrid/bridge/handlers/logout_handler.dart';
import '../hybrid/bridge/handlers/open_external_handler.dart';
import '../hybrid/bridge/handlers/pick_image_handler.dart';
import '../hybrid/bridge/handlers/ping_handler.dart';
import '../hybrid/bridge/handlers/share_handler.dart';
import '../hybrid/bridge/handlers/show_local_notification_handler.dart';
import '../hybrid/bridge/in_memory_bridge_messenger.dart';
import '../platform/camera_service.dart';
import '../platform/connectivity_service.dart';
import '../platform/file_service.dart';
import '../platform/gallery_service.dart';
import '../platform/image_capability_facade.dart';
import '../platform/link_service.dart';
import '../platform/location_service.dart';
import '../platform/notification_service.dart';
import '../platform/permission_service.dart';
import '../platform/share_service.dart';

/// DI del host híbrido.

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});

final appLoggerProvider = Provider<AppLogger>((ref) {
  return AppLogger(flavor: ref.watch(appConfigProvider).flavor);
});

final permissionServiceProvider = Provider<IPermissionService>((ref) {
  return PermissionService(logger: ref.watch(appLoggerProvider));
});

final tokenStoreProvider = Provider<ITokenStore>((ref) {
  return SecureTokenStore(logger: ref.watch(appLoggerProvider));
});

final cameraServiceProvider = Provider<ICameraService>((ref) => CameraService());

final galleryServiceProvider = Provider<IGalleryService>((ref) => GalleryService());

final imageCapabilityFacadeProvider = Provider<ImageCapabilityFacade>((ref) {
  return ImageCapabilityFacade(
    permissions: ref.watch(permissionServiceProvider),
    camera: ref.watch(cameraServiceProvider),
    gallery: ref.watch(galleryServiceProvider),
  );
});

final shareServiceProvider = Provider<IShareService>((ref) => ShareService());

final linkServiceProvider = Provider<ILinkService>((ref) => LinkService());

final connectivityServiceProvider = Provider<IConnectivityService>((ref) {
  return ConnectivityService();
});

final fileServiceProvider = Provider<IFileService>((ref) {
  return FileService(logger: ref.watch(appLoggerProvider));
});

final locationServiceProvider = Provider<ILocationService>((ref) => LocationService());

final notificationServiceProvider = Provider<INotificationService>((ref) {
  return NotificationService(
    logger: ref.watch(appLoggerProvider),
    permissions: ref.watch(permissionServiceProvider),
  );
});

final deviceCapabilityGatewayProvider = Provider<IDeviceCapabilityGateway>((ref) {
  return DeviceCapabilityGatewayStub(ref.watch(permissionServiceProvider));
});

final bridgeMessengerProvider = Provider<IBridgeMessenger>((ref) {
  final messenger = InMemoryBridgeMessenger();
  ref.onDispose(messenger.dispose);
  return messenger;
});

final bridgeDispatcherProvider = Provider<BridgeDispatcher>((ref) {
  final config = ref.watch(appConfigProvider);
  final tokens = ref.watch(tokenStoreProvider);
  return BridgeDispatcher(
    handlers: [
      PingHandler(),
      AuthUpdatedHandler(tokens),
      LogoutHandler(tokens),
      PickImageHandler(ref.watch(imageCapabilityFacadeProvider)),
      ShareHandler(ref.watch(shareServiceProvider)),
      OpenExternalHandler(ref.watch(linkServiceProvider)),
      DownloadHandler(ref.watch(fileServiceProvider)),
      GetLocationHandler(
        permissions: ref.watch(permissionServiceProvider),
        location: ref.watch(locationServiceProvider),
      ),
      ShowLocalNotificationHandler(ref.watch(notificationServiceProvider)),
      GetPushTokenHandler(ref.watch(notificationServiceProvider)),
    ],
    logger: ref.watch(appLoggerProvider),
    protocolVersion: config.bridgeProtocolVersion,
  );
});
