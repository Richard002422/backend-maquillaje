import 'bridge_message.dart';

/// Puerto de mensajería (DIP). WebView o tests implementan este contrato.
abstract class IBridgeMessenger {
  /// Envía un mensaje hacia el SPA (Flutter → JS).
  Future<void> postToWeb(BridgeMessage message);

  /// Stream de mensajes entrantes (JS → Flutter).
  Stream<BridgeMessage> get messagesFromWeb;
}
