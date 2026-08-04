import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../core/logging/app_logger.dart';
import '../domain/repositories/permission_repository.dart';

/// Notificaciones: canal local ahora; FCM remoto cuando exista `google-services.json`.
///
/// **Por qué no FCM aún en el build:** sin proyecto Firebase el plugin
/// `google-services` rompe el APK. Ver `docs/PASO9_GPS_PUSH.md` para activarlo.
abstract class INotificationService {
  Future<void> initialize();
  Future<String?> getDevicePushToken();
  Future<bool> showLocal({required String title, required String body});
}

class NotificationService implements INotificationService {
  NotificationService({
    required AppLogger logger,
    required IPermissionService permissions,
    FlutterLocalNotificationsPlugin? plugin,
  })  : _logger = logger,
        _permissions = permissions,
        _plugin = plugin ?? FlutterLocalNotificationsPlugin();

  static const _channelId = 'glowlab_default';
  static const _channelName = 'GlowLab';

  final AppLogger _logger;
  final IPermissionService _permissions;
  final FlutterLocalNotificationsPlugin _plugin;
  var _ready = false;

  @override
  Future<void> initialize() async {
    if (_ready) return;
    const android = AndroidInitializationSettings('@drawable/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      settings: const InitializationSettings(android: android, iOS: ios),
    );
    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: 'Avisos GlowLab',
        importance: Importance.defaultImportance,
      ),
    );
    _ready = true;
    _logger.info('Local notifications ready (FCM pending Firebase config)', tag: 'push');
  }

  @override
  Future<String?> getDevicePushToken() async {
    // FCM se activa en docs/PASO9 tras añadir google-services.json.
    _logger.debug('FCM token unavailable until Firebase is configured', tag: 'push');
    return null;
  }

  @override
  Future<bool> showLocal({required String title, required String body}) async {
    await initialize();
    final granted = await _permissions.ensureNotifications();
    if (!granted) {
      _logger.warn('Notification permission denied', tag: 'push');
      return false;
    }
    await _plugin.show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: 'Avisos GlowLab',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
    return true;
  }
}

class NotificationServiceStub implements INotificationService {
  @override
  Future<void> initialize() async {}

  @override
  Future<String?> getDevicePushToken() async => null;

  @override
  Future<bool> showLocal({required String title, required String body}) async => false;
}
