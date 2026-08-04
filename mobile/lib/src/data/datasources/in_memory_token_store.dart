import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/token_store.dart';

/// Stub en memoria (tests). No usar en release.
class InMemoryTokenStore implements ITokenStore {
  AuthSession? _session;

  @override
  Future<AuthSession?> readSession() async => _session;

  @override
  Future<void> writeSession(AuthSession session) async {
    _session = session;
  }

  @override
  Future<void> clear() async {
    _session = null;
  }

  @override
  Future<String?> readAccessToken() async => _session?.accessToken;
}
