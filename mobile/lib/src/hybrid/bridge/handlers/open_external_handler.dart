import '../../../platform/link_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `OPEN_EXTERNAL` `{ url }`.
class OpenExternalHandler implements IBridgeMessageHandler {
  OpenExternalHandler(this._links);

  final ILinkService _links;

  @override
  String get type => BridgeMessageTypes.openExternal;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final url = (incoming.payload['url'] as String?)?.trim() ?? '';
    if (url.isEmpty) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.openExternal,
        requestId: incoming.requestId,
        payload: const {'ok': false, 'error': 'url_required'},
      );
    }
    final ok = await _links.openExternal(url);
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.openExternal,
      requestId: incoming.requestId,
      payload: {'ok': ok, if (!ok) 'error': 'launch_failed'},
    );
  }
}
