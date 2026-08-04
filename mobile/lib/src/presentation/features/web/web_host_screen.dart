import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../di/hybrid_providers.dart';
import '../../../hybrid/bridge/connectivity_bridge_watcher.dart';
import '../../../hybrid/bridge/webview_bridge_binder.dart';
import '../../../hybrid/webview/webview_controller_factory.dart';

/// Host WebView del producto (`frontend/` Vite) + bridge.
class WebHostScreen extends ConsumerStatefulWidget {
  const WebHostScreen({super.key});

  @override
  ConsumerState<WebHostScreen> createState() => _WebHostScreenState();
}

class _WebHostScreenState extends ConsumerState<WebHostScreen> {
  WebViewController? _controller;
  ConnectivityBridgeWatcher? _networkWatcher;
  var _loading = true;
  var _progress = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _networkWatcher?.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    final config = ref.read(appConfigProvider);
    final logger = ref.read(appLoggerProvider);
    final dispatcher = ref.read(bridgeDispatcherProvider);
    await _networkWatcher?.dispose();
    _networkWatcher = null;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final binder = WebViewBridgeBinder(
        dispatcher: dispatcher,
        logger: logger,
        tokenStore: ref.read(tokenStoreProvider),
      );
      final controller = await WebViewControllerFactory(
        config: config,
        logger: logger,
        bridgeBinder: binder,
      ).create(
        onProgress: (p) {
          if (mounted) setState(() => _progress = p);
        },
        onPageStarted: (_) {
          if (mounted) {
            setState(() {
              _loading = true;
              _error = null;
            });
          }
        },
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
        onError: (error) {
          logger.error(
            'WebView error: ${error.description} (${error.errorCode})',
            tag: 'webview',
          );
          if (mounted) {
            setState(() {
              _loading = false;
              _error =
                  'No se pudo cargar ${config.webBaseUrl}\n${error.description}\n\n'
                  '¿Está corriendo el frontend? (npm run dev en frontend/)';
            });
          }
        },
      );
      if (!mounted) return;

      final watcher = ConnectivityBridgeWatcher(
        connectivity: ref.read(connectivityServiceProvider),
        binder: binder,
        logger: logger,
        protocolVersion: config.bridgeProtocolVersion,
      );
      await watcher.start(controller);
      _networkWatcher = watcher;

      setState(() => _controller = controller);
    } catch (e, st) {
      ref.read(appLoggerProvider).error('WebView bootstrap failed', tag: 'webview', error: e, stack: st);
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Error iniciando WebView: $e';
        });
      }
    }
  }

  Future<void> _handleBack() async {
    final controller = _controller;
    if (controller != null && await controller.canGoBack()) {
      await controller.goBack();
      return;
    }
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final controller = _controller;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await _handleBack();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('GlowLab Web'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleBack,
          ),
          actions: [
            IconButton(
              tooltip: 'Recargar',
              icon: const Icon(Icons.refresh),
              onPressed: () => _controller?.reload() ?? _bootstrap(),
            ),
          ],
          bottom: _loading
              ? PreferredSize(
                  preferredSize: const Size.fromHeight(2),
                  child: LinearProgressIndicator(
                    value: _progress > 0 && _progress < 100 ? _progress / 100 : null,
                  ),
                )
              : null,
        ),
        body: Stack(
          fit: StackFit.expand,
          children: [
            if (controller != null) WebViewWidget(controller: controller),
            if (_error != null)
              ColoredBox(
                color: Theme.of(context).colorScheme.surface,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 8),
                        Text(
                          'WEB_BASE_URL=${config.webBaseUrl}',
                          style: Theme.of(context).textTheme.bodySmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: _bootstrap,
                          child: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
