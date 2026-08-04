import '../../../domain/repositories/token_store.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: logout.
class LogoutHandler implements IBridgeMessageHandler {
  LogoutHandler(this._tokenStore);

  final ITokenStore _tokenStore;

  @override
  String get type => BridgeMessageTypes.logout;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    await _tokenStore.clear();
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.logout,
      requestId: incoming.requestId,
      payload: const {'ok': true, 'cleared': true},
    );
  }
}
