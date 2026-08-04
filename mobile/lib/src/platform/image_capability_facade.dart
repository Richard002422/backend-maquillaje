import '../core/errors/failures.dart';
import '../core/errors/result.dart';
import '../domain/repositories/permission_repository.dart';
import 'camera_service.dart';
import 'gallery_service.dart';
import 'picked_image_data.dart';

/// Límite soft para no saturar el bridge JS (Paso 7).
const kMaxBridgeImageBytes = 1_800_000; // ~1.8 MB

/// Orquesta permisos + picker. Devuelve [PickedImageData] listo para IMAGE_PICKED.
class ImageCapabilityFacade {
  ImageCapabilityFacade({
    required IPermissionService permissions,
    required ICameraService camera,
    required IGalleryService gallery,
  })  : _permissions = permissions,
        _camera = camera,
        _gallery = gallery;

  final IPermissionService _permissions;
  final ICameraService _camera;
  final IGalleryService _gallery;

  Future<Result<PickedImageData>> pick({required String source}) async {
    final normalized = source.toLowerCase().trim();
    if (normalized == 'camera') {
      final ok = await _permissions.ensureCamera();
      if (!ok) {
        return const Err(PermissionFailure('Permiso de cámara denegado'));
      }
      final image = await _camera.capturePhoto();
      return _validate(image, cancelledMessage: 'Captura cancelada');
    }

    final ok = await _permissions.ensurePhotos();
    if (!ok) {
      return const Err(PermissionFailure('Permiso de fotos denegado'));
    }
    final image = await _gallery.pickImage();
    return _validate(image, cancelledMessage: 'Selección cancelada');
  }

  Result<PickedImageData> _validate(
    PickedImageData? image, {
    required String cancelledMessage,
  }) {
    if (image == null) {
      return Err(PlatformFailure(cancelledMessage, code: 'cancelled'));
    }
    if (image.byteLength > kMaxBridgeImageBytes) {
      return const Err(
        PlatformFailure(
          'Imagen demasiado grande para el bridge. Usa otra foto o reduce calidad.',
          code: 'too_large',
        ),
      );
    }
    return Success(image);
  }
}
