import '../../core/logging/app_logger.dart';
import 'bridge_message.dart';
import 'handlers/bridge_message_handler.dart';

/// Enruta mensajes a handlers registrados (OCP).
class BridgeDispatcher {
  BridgeDispatcher({
    required List<IBridgeMessageHandler> handlers,
    required AppLogger logger,
    required this.protocolVersion,
  })  : _logger = logger,
        _byType = {for (final h in handlers) h.type: h};

  final AppLogger _logger;
  final int protocolVersion;
  final Map<String, IBridgeMessageHandler> _byType;

  Future<BridgeMessage> dispatch(BridgeMessage incoming) async {
    if (incoming.version != protocolVersion) {
      _logger.warn(
        'Bridge version mismatch: got ${incoming.version}, want $protocolVersion',
        tag: 'bridge',
      );
    }
    final handler = _byType[incoming.type];
    if (handler == null) {
      _logger.warn('Unsupported bridge type: ${incoming.type}', tag: 'bridge');
      return BridgeMessage(
        version: protocolVersion,
        type: BridgeMessageTypes.unsupported,
        requestId: incoming.requestId,
        payload: {'requestedType': incoming.type},
      );
    }
    final response = await handler.handle(incoming);
    return response ??
        BridgeMessage(
          version: protocolVersion,
          type: BridgeMessageTypes.pong,
          requestId: incoming.requestId,
        );
  }
}
