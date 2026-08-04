import 'dart:io';

import 'package:image_picker/image_picker.dart';

import 'picked_image_data.dart';

/// Facade de cámara para captura puntual (no AR preview continuo).
abstract class ICameraService {
  Future<PickedImageData?> capturePhoto();
}

class CameraService implements ICameraService {
  CameraService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  final ImagePicker _picker;

  @override
  Future<PickedImageData?> capturePhoto() async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1280,
      maxHeight: 1280,
      imageQuality: 70,
      preferredCameraDevice: CameraDevice.front,
    );
    if (file == null) return null;
    return pickedImageFromFile(File(file.path));
  }
}

class CameraServiceStub implements ICameraService {
  @override
  Future<PickedImageData?> capturePhoto() async => null;
}
