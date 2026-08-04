import '../../../platform/notification_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `GET_PUSH_TOKEN` (FCM cuando esté configurado).
class GetPushTokenHandler implements IBridgeMessageHandler {
  GetPushTokenHandler(this._notifications);

  final INotificationService _notifications;

  @override
  String get type => BridgeMessageTypes.getPushToken;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    await _notifications.initialize();
    final token = await _notifications.getDevicePushToken();
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.pushToken,
      requestId: incoming.requestId,
      payload: {
        'ok': token != null,
        'token': token,
        'provider': token == null ? 'pending_fcm' : 'fcm',
        if (token == null)
          'message':
              'FCM no configurado. Añade google-services.json (ver PASO9_GPS_PUSH.md).',
      },
    );
  }
}
