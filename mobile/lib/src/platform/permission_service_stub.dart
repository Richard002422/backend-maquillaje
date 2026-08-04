import '../domain/repositories/permission_repository.dart';

/// Stub: deniega todo. Útil en tests unitarios sin plugins.
class PermissionServiceStub implements IPermissionService {
  @override
  Future<bool> ensureCamera() async => false;

  @override
  Future<bool> ensurePhotos() async => false;

  @override
  Future<bool> ensureLocationWhenInUse() async => false;

  @override
  Future<bool> ensureNotifications() async => false;

  @override
  Future<bool> openSystemSettings() async => false;
}
