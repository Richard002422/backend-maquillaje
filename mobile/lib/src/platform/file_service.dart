import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../core/logging/app_logger.dart';

/// Descargas al directorio de la app (scoped; sin WRITE_EXTERNAL).
abstract class IFileService {
  Future<String?> downloadToAppDir({required String url, required String fileName});

  /// Guarda bytes generados en el propio WebView (p. ej. la foto compuesta
  /// del probador de pestañas con IA — un `canvas.toBlob()` nunca es una URL
  /// http, así que `downloadToAppDir` no sirve para esto). `dataUrl` es del
  /// formato `data:<mime>;base64,<...>` que produce `FileReader.readAsDataURL`
  /// en el lado web. NO guarda en la galería del sistema (Fotos/Photos) —
  /// solo en el almacenamiento privado de la app; eso requeriría un paquete
  /// nuevo (p. ej. `gal`) y permisos adicionales que no se añadieron aquí.
  Future<String?> saveDataUrlToAppDir({required String dataUrl, required String fileName});
}

class FileService implements IFileService {
  FileService({required AppLogger logger, http.Client? client})
      : _logger = logger,
        _http = client ?? http.Client();

  final AppLogger _logger;
  final http.Client _http;

  @override
  Future<String?> downloadToAppDir({
    required String url,
    required String fileName,
  }) async {
    final uri = Uri.tryParse(url);
    if (uri == null || !(uri.isScheme('http') || uri.isScheme('https'))) {
      _logger.warn('Invalid download URL: $url', tag: 'files');
      return null;
    }

    final response = await _http.get(uri);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      _logger.warn('Download HTTP ${response.statusCode}', tag: 'files');
      return null;
    }
    return _writeToDownloads(fileName: fileName, bytes: response.bodyBytes);
  }

  @override
  Future<String?> saveDataUrlToAppDir({
    required String dataUrl,
    required String fileName,
  }) async {
    final commaIndex = dataUrl.indexOf(',');
    if (!dataUrl.startsWith('data:') || commaIndex == -1) {
      _logger.warn('Invalid data URL for save (missing data:/comma)', tag: 'files');
      return null;
    }
    final Uint8List bytes;
    try {
      bytes = base64Decode(dataUrl.substring(commaIndex + 1));
    } on FormatException catch (e) {
      _logger.warn('Invalid base64 in data URL: $e', tag: 'files');
      return null;
    }
    return _writeToDownloads(fileName: fileName, bytes: bytes);
  }

  Future<String?> _writeToDownloads({required String fileName, required List<int> bytes}) async {
    final safeName = fileName.replaceAll(RegExp(r'[^\w.\-]+'), '_');
    final dir = await getApplicationDocumentsDirectory();
    final target = File('${dir.path}/downloads/$safeName');
    await target.parent.create(recursive: true);
    await target.writeAsBytes(bytes, flush: true);
    _logger.info('Saved → ${target.path}', tag: 'files');
    return target.path;
  }
}

class FileServiceStub implements IFileService {
  @override
  Future<String?> downloadToAppDir({
    required String url,
    required String fileName,
  }) async =>
      null;

  @override
  Future<String?> saveDataUrlToAppDir({
    required String dataUrl,
    required String fileName,
  }) async =>
      null;
}
