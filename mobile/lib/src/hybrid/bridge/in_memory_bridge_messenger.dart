import 'dart:async';

import 'bridge_contract.dart';
import 'bridge_message.dart';

/// Messenger en memoria para DI/tests hasta que exista WebView (Paso 4–5).
class InMemoryBridgeMessenger implements IBridgeMessenger {
  final _controller = StreamController<BridgeMessage>.broadcast();

  @override
  Stream<BridgeMessage> get messagesFromWeb => _controller.stream;

  @override
  Future<void> postToWeb(BridgeMessage message) async {
    // Sin WebView aún: no-op. En Paso 5 se encola hacia JS.
  }

  /// Simula un mensaje entrante desde JS (tests / Paso 5).
  void simulateFromWeb(BridgeMessage message) {
    _controller.add(message);
  }

  Future<void> dispose() async {
    await _controller.close();
  }
}
