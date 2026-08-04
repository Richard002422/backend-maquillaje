import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../core/logging/app_logger.dart';

/// Descargas al directorio de la app (scoped; sin WRITE_EXTERNAL).
abstract class IFileService {
  Future<String?> downloadToAppDir({required String url, required String fileName});
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

    final safeName = fileName.replaceAll(RegExp(r'[^\w.\-]+'), '_');
    final dir = await getApplicationDocumentsDirectory();
    final target = File('${dir.path}/downloads/$safeName');
    await target.parent.create(recursive: true);

    final response = await _http.get(uri);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      _logger.warn('Download HTTP ${response.statusCode}', tag: 'files');
      return null;
    }
    await target.writeAsBytes(response.bodyBytes, flush: true);
    _logger.info('Downloaded → ${target.path}', tag: 'files');
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
}
