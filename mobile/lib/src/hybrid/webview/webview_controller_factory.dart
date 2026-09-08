import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show Colors;
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

import '../../core/config/app_config.dart';
import '../../core/logging/app_logger.dart';
import '../../domain/repositories/permission_repository.dart';
import '../bridge/webview_bridge_binder.dart';

/// Fabrica el [WebViewController] del host híbrido.
class WebViewControllerFactory {
  const WebViewControllerFactory({
    required this.config,
    required this.logger,
    required this.permissions,
    this.bridgeBinder,
  });

  final AppConfig config;
  final AppLogger logger;
  final WebViewBridgeBinder? bridgeBinder;

  /// Necesario para conceder el permiso de cámara del WebView (Fase 6 del
  /// probador de pestañas con IA): `getUserMedia()` dentro de la página no
  /// funciona con solo el permiso CAMERA de Android/iOS — el WebView tiene su
  /// PROPIA capa de permisos (`onPermissionRequest`/`WKUIDelegate`) que hay
  /// que conceder explícitamente, y a su vez esa concesión solo tiene efecto
  /// si el permiso nativo del sistema ya está otorgado. Sin este servicio,
  /// la cámara nunca arranca dentro de la app empaquetada (sí en un navegador
  /// normal, donde el propio navegador ya gestiona ese permiso).
  final IPermissionService permissions;

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
        await platform.setOnPlatformPermissionRequest(_handlePermissionRequest);
      }
    } else if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      final platform = controller.platform;
      if (platform is WebKitWebViewController) {
        await platform.setOnPlatformPermissionRequest(_handlePermissionRequest);
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

  /// Decide si conceder lo que la página (getUserMedia del probador de
  /// pestañas) pidió al WebView. Solo concede cámara — y solo si ya
  /// conseguimos el permiso CAMERA del sistema operativo (ver comentario del
  /// campo [permissions] arriba). Cualquier solicitud que incluya micrófono
  /// se deniega entera: hoy nada en el frontend lo necesita
  /// (`getUserMedia({video:..., audio:false})`), así que un sitio pidiéndolo
  /// sería inesperado — mejor negar por defecto que conceder de más.
  Future<void> _handlePermissionRequest(PlatformWebViewPermissionRequest request) async {
    final wantsCamera = request.types.contains(WebViewPermissionResourceType.camera);
    final wantsOnlyCamera = wantsCamera && request.types.length == 1;

    if (!wantsOnlyCamera) {
      logger.warn('WebView permission request denegado: ${request.types}', tag: 'webview');
      await request.deny();
      return;
    }

    final granted = await permissions.ensureCamera();
    if (granted) {
      logger.info('WebView: permiso de cámara concedido', tag: 'webview');
      await request.grant();
    } else {
      logger.warn('WebView: permiso de cámara del sistema no concedido', tag: 'webview');
      await request.deny();
    }
  }
}
