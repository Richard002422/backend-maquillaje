import '../../../platform/image_capability_facade.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `PICK_IMAGE` con `{ source: 'gallery' | 'camera' }`.
/// Flutter → Web: `IMAGE_PICKED` con data URL (comprimida) o error en payload.
class PickImageHandler implements IBridgeMessageHandler {
  PickImageHandler(this._images);

  final ImageCapabilityFacade _images;

  @override
  String get type => BridgeMessageTypes.pickImage;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final source = (incoming.payload['source'] as String?) ?? 'gallery';
    final result = await _images.pick(source: source);

    return result.when(
      success: (image) => BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.imagePicked,
        requestId: incoming.requestId,
        payload: {
          'ok': true,
          'source': source,
          'mimeType': image.mimeType,
          'byteLength': image.byteLength,
          'dataUrl': image.dataUrl,
          // path solo para debug nativo; el SPA debe usar dataUrl
          'path': image.path,
        },
      ),
      failure: (f) => BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.imagePicked,
        requestId: incoming.requestId,
        payload: {
          'ok': false,
          'source': source,
          'error': f.message,
          'code': f.code,
        },
      ),
    );
  }
}
