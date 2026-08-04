import '../../../platform/notification_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `SHOW_LOCAL_NOTIFICATION` `{ title, body }`.
class ShowLocalNotificationHandler implements IBridgeMessageHandler {
  ShowLocalNotificationHandler(this._notifications);

  final INotificationService _notifications;

  @override
  String get type => BridgeMessageTypes.showLocalNotification;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final title = (incoming.payload['title'] as String?)?.trim() ?? 'GlowLab';
    final body = (incoming.payload['body'] as String?)?.trim() ?? '';
    if (body.isEmpty) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.showLocalNotification,
        requestId: incoming.requestId,
        payload: const {'ok': false, 'error': 'body_required'},
      );
    }
    final ok = await _notifications.showLocal(title: title, body: body);
    return BridgeMessage(
      version: incoming.version,
      type: BridgeMessageTypes.showLocalNotification,
      requestId: incoming.requestId,
      payload: {
        'ok': ok,
        if (!ok) 'error': 'permission_or_init_failed',
      },
    );
  }
}
