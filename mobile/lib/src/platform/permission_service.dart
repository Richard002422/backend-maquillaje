import 'dart:io';

import 'package:permission_handler/permission_handler.dart';

import '../core/logging/app_logger.dart';
import '../domain/repositories/permission_repository.dart';

/// Implementación real (Paso 3) con `permission_handler`.
///
/// **Contrato de producto:** no pedir todos los permisos al cold start.
/// Cada `ensure*` se invoca solo cuando una capability lo necesita
/// (AR, galería, GPS, push).
///
/// Android 10–14+:
/// - Cámara → `CAMERA`
/// - Fotos → `READ_MEDIA_IMAGES` (API 33+) / storage legacy (≤32)
/// - Ubicación → `ACCESS_FINE/COARSE_LOCATION` (when-in-use)
/// - Notificaciones → `POST_NOTIFICATIONS` (API 33+)
class PermissionService implements IPermissionService {
  PermissionService({required AppLogger logger}) : _logger = logger;

  final AppLogger _logger;

  @override
  Future<bool> ensureCamera() => _request(Permission.camera, tag: 'camera');

  @override
  Future<bool> ensurePhotos() async {
    // API 33+: READ_MEDIA_IMAGES vía Permission.photos.
    final photosOk = await _request(Permission.photos, tag: 'photos');
    if (photosOk) return true;

    // Dispositivos ≤ Android 12: READ_EXTERNAL_STORAGE.
    if (Platform.isAndroid) {
      return _request(Permission.storage, tag: 'storage');
    }
    return false;
  }

  @override
  Future<bool> ensureLocationWhenInUse() =>
      _request(Permission.locationWhenInUse, tag: 'location');

  @override
  Future<bool> ensureNotifications() =>
      _request(Permission.notification, tag: 'notification');

  @override
  Future<bool> openSystemSettings() => openAppSettings();

  Future<bool> _request(Permission permission, {required String tag}) async {
    final current = await permission.status;
    if (current.isGranted || current.isLimited) {
      _logger.debug('$tag already granted ($current)', tag: 'permission');
      return true;
    }

    if (current.isPermanentlyDenied) {
      _logger.warn('$tag permanently denied — abrir ajustes del sistema', tag: 'permission');
      return false;
    }

    final next = await permission.request();
    final ok = next.isGranted || next.isLimited;
    _logger.info('$tag request → $next (ok=$ok)', tag: 'permission');
    return ok;
  }
}
