import 'package:flutter/foundation.dart';

/// Logger mínimo. En Paso posteriores se puede conectar a Crashlytics/Sentry.
///
/// **Por qué no `print` directo:** centraliza filtrado por flavor y evita
/// filtrar tokens en release.
class AppLogger {
  const AppLogger({required this.flavor});

  final String flavor;

  void debug(String message, {String? tag}) {
    if (kReleaseMode && flavor == 'prod') return;
    debugPrint(_format('DEBUG', tag, message));
  }

  void info(String message, {String? tag}) {
    debugPrint(_format('INFO', tag, message));
  }

  void warn(String message, {String? tag}) {
    debugPrint(_format('WARN', tag, message));
  }

  void error(String message, {String? tag, Object? error, StackTrace? stack}) {
    debugPrint(_format('ERROR', tag, message));
    if (error != null) debugPrint('  cause: $error');
    if (stack != null) debugPrint('$stack');
  }

  String _format(String level, String? tag, String message) {
    final prefix = tag == null ? 'GlowLab' : 'GlowLab/$tag';
    return '[$level][$prefix] $message';
  }
}
