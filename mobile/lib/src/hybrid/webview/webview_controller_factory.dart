import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show Colors;
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../bridge/webview_bridge_binder.dart';

/// Fabrica el [WebViewController] del host híbrido.
class WebViewControllerFactory {
  const WebViewControllerFactory({
    required this.config,
    required this.logger,
    this.bridgeBinder,
  });

  final AppConfig config;
  final AppLogger logger;
  final WebViewBridgeBinder? bridgeBinder;

  Future<WebViewController> create({
    required void Function(String url) onPageStarted,
    required void Function(String url) onPageFinished,
    required void Function(WebResourceError error) onError,
    required void Function(int progress) onProgress,
  }) async {
    final controller = WebViewController();

    await controller.setJavaScriptMode(JavaScriptMode.unrestricted);
    await controller.setBackgroundColor(Colors.transparent);

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      final platform = controller.platform;
      if (platform is AndroidWebViewController) {
        await AndroidWebViewController.enableDebugging(config.isDev);
        await platform.setMediaPlaybackRequiresUserGesture(false);
        if (config.isDev) {
          await platform.setMixedContentMode(MixedContentMode.alwaysAllow);
        }
      }
    }

    // Canal JS antes de cargar la URL (requisito Android).
    if (bridgeBinder != null) {
      await bridgeBinder!.attach(controller);
    }

    await controller.setNavigationDelegate(
      NavigationDelegate(
        onProgress: onProgress,
        onPageStarted: onPageStarted,
        onPageFinished: (url) async {
          if (bridgeBinder != null) {
            await bridgeBinder!.announceHostReady(controller);
          }
          onPageFinished(url);
        },
        onWebResourceError: onError,
        onNavigationRequest: (request) {
          logger.debug('nav → ${request.url}', tag: 'webview');
          return NavigationDecision.navigate;
        },
      ),
    );

    final uri = Uri.parse(config.webBaseUrl);
    logger.info('Loading WebView $uri', tag: 'webview');
    await controller.loadRequest(uri);
    return controller;
  }
}
