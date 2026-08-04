import '../../../domain/entities/auth_session.dart';
import '../../../domain/repositories/token_store.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: la SPA acaba de login/register/refresh.
class AuthUpdatedHandler implements IBridgeMessageHandler {
  AuthUpdatedHandler(this._tokenStore);

  final ITokenStore _tokenStore;

  @override
  String get type => BridgeMessageTypes.authUpdated;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final session = AuthSession.fromJson(incoming.payload);
    if (!session.isValid) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.unsupported,
        requestId: incoming.requestId,
        payload: const {'error': 'invalid_session_payload'},
      );
    }
    await _tokenStore.writeSession(session);
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.authSync,
      requestId: incoming.requestId,
      payload: {
        'ok': true,
        'accessToken': session.accessToken,
        'tokenType': session.tokenType,
        'expiresIn': session.expiresIn,
        'savedAt': session.savedAt,
        // No reenviar refresh al JS en el ack si ya lo tiene; sí en AUTH_SYNC inicial.
        'refreshToken': session.refreshToken,
      },
    );
  }
}
