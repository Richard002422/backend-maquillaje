import '../../../domain/repositories/permission_repository.dart';
import '../../../platform/location_service.dart';
import '../bridge_message.dart';
import 'bridge_message_handler.dart';

/// Web → Flutter: `GET_LOCATION` → `LOCATION`.
class GetLocationHandler implements IBridgeMessageHandler {
  GetLocationHandler({
    required IPermissionService permissions,
    required ILocationService location,
  })  : _permissions = permissions,
        _location = location;

  final IPermissionService _permissions;
  final ILocationService _location;

  @override
  String get type => BridgeMessageTypes.getLocation;

  @override
  Future<BridgeMessage?> handle(BridgeMessage incoming) async {
    final granted = await _permissions.ensureLocationWhenInUse();
    if (!granted) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.location,
        requestId: incoming.requestId,
        payload: const {
          'ok': false,
          'error': 'Permiso de ubicación denegado',
          'code': 'permission_denied',
        },
      );
    }

    final enabled = await _location.isServiceEnabled();
    if (!enabled) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.location,
        requestId: incoming.requestId,
        payload: const {
          'ok': false,
          'error': 'GPS desactivado en el sistema',
          'code': 'service_disabled',
        },
      );
    }

    try {
      final point = await _location.getCurrentPosition();
      if (point == null) {
        return BridgeMessage(
          version: incoming.version,
          type: BridgeMessageTypes.location,
          requestId: incoming.requestId,
          payload: const {'ok': false, 'error': 'No se obtuvo posición', 'code': 'unavailable'},
        );
      }
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.location,
        requestId: incoming.requestId,
        payload: {
          'ok': true,
          'latitude': point.latitude,
          'longitude': point.longitude,
        },
      );
    } catch (e) {
      return BridgeMessage(
        version: incoming.version,
        type: BridgeMessageTypes.location,
        requestId: incoming.requestId,
        payload: {'ok': false, 'error': e.toString(), 'code': 'exception'},
      );
    }
  }
}
