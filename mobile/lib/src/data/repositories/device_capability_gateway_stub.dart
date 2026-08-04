import '../../core/errors/failures.dart';
import '../../core/errors/result.dart';
import '../../domain/repositories/device_capability_gateway.dart';
import '../../domain/repositories/permission_repository.dart';

/// Stub Paso 1: no llama plugins. Devuelve errores controlados.
///
/// Sustituir por `DeviceCapabilityGatewayImpl` cuando existan platform services.
class DeviceCapabilityGatewayStub implements IDeviceCapabilityGateway {
  DeviceCapabilityGatewayStub(this._permissions);

  final IPermissionService _permissions;

  @override
  Future<Result<String>> pickImageFromGallery() async {
    final ok = await _permissions.ensurePhotos();
    if (!ok) {
      return const Err(PermissionFailure('Fotos no concedidas (stub)'));
    }
    return const Err(PlatformFailure('GalleryService pendiente (Paso 7)'));
  }

  @override
  Future<Result<String>> captureImageFromCamera() async {
    final ok = await _permissions.ensureCamera();
    if (!ok) {
      return const Err(PermissionFailure('Cámara no concedida (stub)'));
    }
    return const Err(PlatformFailure('CameraService pendiente (Paso 7)'));
  }

  @override
  Future<Result<GeoPoint>> getCurrentLocation() async {
    final ok = await _permissions.ensureLocationWhenInUse();
    if (!ok) {
      return const Err(PermissionFailure('Ubicación no concedida (stub)'));
    }
    return const Err(PlatformFailure('LocationService pendiente (Paso 9)'));
  }

  @override
  Future<Result<void>> shareText(String text) async {
    return const Err(PlatformFailure('ShareService pendiente (Paso 8)'));
  }

  @override
  Future<Result<void>> openExternalUrl(String url) async {
    return const Err(PlatformFailure('LinkService pendiente (Paso 8)'));
  }

  @override
  Stream<bool> watchOnline() => Stream<bool>.value(true);
}
