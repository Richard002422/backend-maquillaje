/// Mensaje versionado Flutter ↔ JavaScript (GlowLabBridge v1).
///
/// Contrato estable: añadir tipos nuevos sin romper clientes viejos.
/// Desconocido → [BridgeDispatcher] responde `UNSUPPORTED`.
class BridgeMessage {
  const BridgeMessage({
    required this.version,
    required this.type,
    required this.requestId,
    this.payload = const <String, dynamic>{},
  });

  final int version;
  final String type;
  final String requestId;
  final Map<String, dynamic> payload;

  factory BridgeMessage.fromJson(Map<String, dynamic> json) {
    return BridgeMessage(
      version: json['version'] as int? ?? 1,
      type: json['type'] as String? ?? '',
      requestId: json['requestId'] as String? ?? '',
      payload: (json['payload'] as Map?)?.cast<String, dynamic>() ?? const {},
    );
  }

  Map<String, dynamic> toJson() => {
        'version': version,
        'type': type,
        'requestId': requestId,
        'payload': payload,
      };
}

/// Tipos conocidos del protocolo v1 (documentación viva).
abstract final class BridgeMessageTypes {
  static const ping = 'PING';
  static const pong = 'PONG';
  static const authSync = 'AUTH_SYNC';
  static const authUpdated = 'AUTH_UPDATED';
  static const logout = 'LOGOUT';
  static const pickImage = 'PICK_IMAGE';
  static const imagePicked = 'IMAGE_PICKED';
  static const getLocation = 'GET_LOCATION';
  static const location = 'LOCATION';
  static const share = 'SHARE';
  static const download = 'DOWNLOAD';
  static const openExternal = 'OPEN_EXTERNAL';
  static const networkChanged = 'NETWORK_CHANGED';
  static const openNativeAr = 'OPEN_NATIVE_AR';
  static const requestPermission = 'REQUEST_PERMISSION';
  static const permissionResult = 'PERMISSION_RESULT';
  static const getPushToken = 'GET_PUSH_TOKEN';
  static const pushToken = 'PUSH_TOKEN';
  static const showLocalNotification = 'SHOW_LOCAL_NOTIFICATION';
  static const hostReady = 'HOST_READY';
  static const unsupported = 'UNSUPPORTED';
}
