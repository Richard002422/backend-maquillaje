import '../../../platform/file_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `DOWNLOAD` `{ url, fileName? }` o `{ dataUrl, fileName? }`.
///
/// `dataUrl` (formato `data:<mime>;base64,<...>`) existe para contenido
/// generado en el propio cliente (p. ej. el `canvas.toBlob()` del probador de
/// pestañas con IA) que nunca tuvo una URL http — ver comentario en
/// `IFileService.saveDataUrlToAppDir`. Si vienen ambos, `dataUrl` gana.
class DownloadHandler implements IBridgeMessageHandler {
  DownloadHandler(this._files);

  final IFileService _files;

  @override
  String get type => BridgeMessageTypes.download;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final dataUrl = (incoming.payload['dataUrl'] as String?)?.trim() ?? '';
    final url = (incoming.payload['url'] as String?)?.trim() ?? '';
    final requestedFileName = (incoming.payload['fileName'] as String?)?.trim() ?? '';

    if (dataUrl.isEmpty && url.isEmpty) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.download,
        requestId: incoming.requestId,
        payload: const {'ok': false, 'error': 'url_or_dataurl_required'},
      );
    }

    final String fileName;
    final String? path;
    if (dataUrl.isNotEmpty) {
      fileName = requestedFileName.isNotEmpty ? requestedFileName : 'glowlab-${DateTime.now().millisecondsSinceEpoch}.jpg';
      path = await _files.saveDataUrlToAppDir(dataUrl: dataUrl, fileName: fileName);
    } else {
      fileName = requestedFileName.isNotEmpty ? requestedFileName : _guessFileName(url);
      path = await _files.downloadToAppDir(url: url, fileName: fileName);
    }

    if (path == null) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.download,
        requestId: incoming.requestId,
        payload: const {'ok': false, 'error': 'download_failed'},
      );
    }
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.download,
      requestId: incoming.requestId,
      payload: {'ok': true, 'path': path, 'fileName': fileName},
    );
  }

  String _guessFileName(String url) {
    final uri = Uri.tryParse(url);
    final last = uri?.pathSegments.isNotEmpty == true ? uri!.pathSegments.last : 'download.bin';
    return last.isEmpty ? 'download.bin' : last;
  }
}
