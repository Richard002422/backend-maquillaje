import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Responde PING → PONG. Útil para validar el bridge en Paso 5.
class PingHandler implements IBridgeMessageHandler {
  @override
  String get type => BridgeMessageTypes.ping;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.pong,
      requestId: incoming.requestId,
      payload: {'echo': incoming.payload, 'source': 'flutter'},
    );
  }
}
