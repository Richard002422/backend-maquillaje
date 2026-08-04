import '../entities/auth_session.dart';

/// Almacén cifrado del JWT. Nunca Hive/SharedPreferences para tokens.
abstract class ITokenStore {
  Future<AuthSession?> readSession();
  Future<void> writeSession(AuthSession session);
  Future<void> clear();
  Future<String?> readAccessToken();
}
