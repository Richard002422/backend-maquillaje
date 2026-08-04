import '../bridge_message.dart';

/// Handler Open/Closed: un tipo de mensaje = una clase.
abstract class IBridgeMessageHandler {
  String get type;
  Future<BridgeMessage?> handle(BridgeMessage incoming);
}
