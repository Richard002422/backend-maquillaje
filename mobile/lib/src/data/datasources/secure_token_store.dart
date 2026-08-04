import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/logging/app_logger.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/token_store.dart';

/// Persistencia cifrada de la sesión (Android Keystore / iOS Keychain).
///
/// **Fuente de verdad nativa** cuando la app corre en Flutter. El WebView
/// mantiene un espejo en `localStorage` solo para llamadas `fetch` del SPA.
class SecureTokenStore implements ITokenStore {
  SecureTokenStore({
    required AppLogger logger,
    FlutterSecureStorage? storage,
  })  : _logger = logger,
        _storage = storage ?? const FlutterSecureStorage();

  static const _sessionKey = 'glowlab_auth_session_v1';

  final AppLogger _logger;
  final FlutterSecureStorage _storage;

  @override
  Future<AuthSession?> readSession() async {
    try {
      final raw = await _storage.read(key: _sessionKey);
      if (raw == null || raw.isEmpty) return null;
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final session = AuthSession.fromJson(map);
      return session.isValid ? session : null;
    } catch (e, st) {
      _logger.error('SecureTokenStore.readSession failed', tag: 'auth', error: e, stack: st);
      return null;
    }
  }

  @override
  Future<void> writeSession(AuthSession session) async {
    await _storage.write(key: _sessionKey, value: jsonEncode(session.toJson()));
    _logger.info('Session saved to secure storage', tag: 'auth');
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: _sessionKey);
    _logger.info('Session cleared from secure storage', tag: 'auth');
  }

  @override
  Future<String?> readAccessToken() async => (await readSession())?.accessToken;
}
