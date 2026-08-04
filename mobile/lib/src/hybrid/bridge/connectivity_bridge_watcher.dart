import 'dart:async';

import 'package:webview_flutter/webview_flutter.dart';

import '../../core/logging/app_logger.dart';
import '../../platform/connectivity_service.dart';
import 'bridge_message.dart';
import 'webview_bridge_binder.dart';

/// Empuja `NETWORK_CHANGED` al SPA cuando cambia la conectividad.
class ConnectivityBridgeWatcher {
  ConnectivityBridgeWatcher({
    required IConnectivityService connectivity,
    required WebViewBridgeBinder binder,
    required AppLogger logger,
    required int protocolVersion,
  })  : _connectivity = connectivity,
        _binder = binder,
        _logger = logger,
        _protocolVersion = protocolVersion;

  final IConnectivityService _connectivity;
  final WebViewBridgeBinder _binder;
  final AppLogger _logger;
  final int _protocolVersion;
  StreamSubscription<bool>? _sub;

  Future<void> start(WebViewController controller) async {
    await _sub?.cancel();
    final online = await _connectivity.isOnline;
    await _push(controller, online);

    _sub = _connectivity.onStatusChange.listen((isOnline) {
      _logger.debug('network → $isOnline', tag: 'network');
      unawaited(_push(controller, isOnline));
    });
  }

  Future<void> _push(WebViewController controller, bool online) {
    return _binder.postToWeb(
      controller,
      BridgeMessage(
        version: _protocolVersion,
        type: BridgeMessageTypes.networkChanged,
        requestId: 'network-${DateTime.now().millisecondsSinceEpoch}',
        payload: {'online': online},
      ),
    );
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    _sub = null;
  }
}
