import 'dart:convert';

import 'package:webview_flutter/webview_flutter.dart';

import '../../core/logging/app_logger.dart';
import '../../domain/repositories/token_store.dart';
import 'bridge_dispatcher.dart';
import 'bridge_message.dart';

/// Nombre del [JavascriptChannel] expuesto a la página.
const kGlowLabBridgeChannelName = 'GlowLabBridgeChannel';

/// Conecta el WebView con [BridgeDispatcher] + sync de auth (Paso 5–6).
class WebViewBridgeBinder {
  WebViewBridgeBinder({
    required BridgeDispatcher dispatcher,
    required AppLogger logger,
    required ITokenStore tokenStore,
  })  : _dispatcher = dispatcher,
        _logger = logger,
        _tokenStore = tokenStore;

  final BridgeDispatcher _dispatcher;
  final AppLogger _logger;
  final ITokenStore _tokenStore;

  Future<void> attach(WebViewController controller) async {
    await controller.addJavaScriptChannel(
      kGlowLabBridgeChannelName,
      onMessageReceived: (JavaScriptMessage raw) async {
        await _onMessage(controller, raw.message);
      },
    );
  }

  Future<void> announceHostReady(WebViewController controller) async {
    await postToWeb(
      controller,
      BridgeMessage(
        version: _dispatcher.protocolVersion,
        type: BridgeMessageTypes.hostReady,
        requestId: 'host-ready',
        payload: const {'platform': 'flutter', 'channel': kGlowLabBridgeChannelName},
      ),
    );
    await pushAuthSync(controller);
  }

  /// Flutter → Web: inyecta sesión nativa (fuente de verdad en Secure Storage).
  Future<void> pushAuthSync(WebViewController controller) async {
    final session = await _tokenStore.readSession();
    if (session == null || !session.isValid) {
      _logger.debug('No native session to AUTH_SYNC', tag: 'auth');
      return;
    }
    await postToWeb(
      controller,
      BridgeMessage(
        version: _dispatcher.protocolVersion,
        type: BridgeMessageTypes.authSync,
        requestId: 'auth-sync',
        payload: session.toJson(),
      ),
    );
  }

  Future<void> postToWeb(WebViewController controller, BridgeMessage message) async {
    final json = jsonEncode(message.toJson());
    _logger.debug('→ JS ${message.type} ${message.requestId}', tag: 'bridge');
    await controller.runJavaScript(
      'window.GlowLabBridge && window.GlowLabBridge._receiveFromFlutter($json);',
    );
  }

  Future<void> _onMessage(WebViewController controller, String raw) async {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        _logger.warn('Bridge payload not an object: $raw', tag: 'bridge');
        return;
      }
      final incoming = BridgeMessage.fromJson(Map<String, dynamic>.from(decoded));
      _logger.info('← JS ${incoming.type} ${incoming.requestId}', tag: 'bridge');
      final response = await _dispatcher.dispatch(incoming);
      await postToWeb(controller, response);
    } catch (e, st) {
      _logger.error('Bridge message failed', tag: 'bridge', error: e, stack: st);
    }
  }
}
