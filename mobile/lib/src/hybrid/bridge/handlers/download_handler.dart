import '../../../platform/file_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `DOWNLOAD` `{ url, fileName? }`.
class DownloadHandler implements IBridgeMessageHandler {
  DownloadHandler(this._files);

  final IFileService _files;

  @override
  String get type => BridgeMessageTypes.download;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final url = (incoming.payload['url'] as String?)?.trim() ?? '';
    if (url.isEmpty) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.download,
        requestId: incoming.requestId,
        payload: const {'ok': false, 'error': 'url_required'},
      );
    }
    final fileName = (incoming.payload['fileName'] as String?)?.trim().isNotEmpty == true
        ? (incoming.payload['fileName'] as String).trim()
        : _guessFileName(url);

    final path = await _files.downloadToAppDir(url: url, fileName: fileName);
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
