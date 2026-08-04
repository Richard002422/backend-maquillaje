/// Permisos Android/iOS por capability (no “allow all” al arranque).
abstract class IPermissionService {
  Future<bool> ensureCamera();
  Future<bool> ensurePhotos();
  Future<bool> ensureLocationWhenInUse();
  Future<bool> ensureNotifications();

  /// Abre la pantalla de ajustes de la app (cuando el permiso está
  /// permanentemente denegado).
  Future<bool> openSystemSettings();
}
