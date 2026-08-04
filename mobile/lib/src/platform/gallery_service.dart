import 'dart:io';

import 'package:image_picker/image_picker.dart';

import 'picked_image_data.dart';

/// Selección de imágenes de galería (Photo Picker / READ_MEDIA_IMAGES).
abstract class IGalleryService {
  Future<PickedImageData?> pickImage();
}

class GalleryService implements IGalleryService {
  GalleryService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  final ImagePicker _picker;

  @override
  Future<PickedImageData?> pickImage() async {
    final file = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1280,
      maxHeight: 1280,
      imageQuality: 70,
    );
    if (file == null) return null;
    return pickedImageFromFile(File(file.path));
  }
}

class GalleryServiceStub implements IGalleryService {
  @override
  Future<PickedImageData?> pickImage() async => null;
}
