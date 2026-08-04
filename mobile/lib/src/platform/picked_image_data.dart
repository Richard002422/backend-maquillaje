import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

/// Resultado de captura/selección listo para el bridge (Paso 7).
class PickedImageData {
  const PickedImageData({
    required this.path,
    required this.bytes,
    required this.mimeType,
  });

  final String path;
  final Uint8List bytes;
  final String mimeType;

  String get base64 => base64Encode(bytes);
  int get byteLength => bytes.length;

  /// Data URL usable en `<img src>` del SPA.
  String get dataUrl => 'data:$mimeType;base64,$base64';
}

String mimeFromPath(String path) {
  final lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

Future<PickedImageData> pickedImageFromFile(File file) async {
  final bytes = await file.readAsBytes();
  return PickedImageData(
    path: file.path,
    bytes: bytes,
    mimeType: mimeFromPath(file.path),
  );
}
