import '../../../platform/share_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `SHARE` `{ text, subject? }`.
class ShareHandler implements IBridgeMessageHandler {
  ShareHandler(this._share);

  final IShareService _share;

  @override
  String get type => BridgeMessageTypes.share;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final text = (incoming.payload['text'] as String?)?.trim() ?? '';
    if (text.isEmpty) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.share,
        requestId: incoming.requestId,
        payload: const {'ok': false, 'error': 'text_required'},
      );
    }
    final subject = incoming.payload['subject'] as String?;
    await _share.shareText(text, subject: subject);
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.share,
      requestId: incoming.requestId,
      payload: const {'ok': true},
    );
  }
}
