import '../../core/errors/result.dart';

/// Punto de entrada a capacidades del dispositivo (ISP: interfaces separadas
/// por capability viven en `platform/`; este repo agrega orquestación futura).
abstract class IDeviceCapabilityGateway {
  Future<Result<String>> pickImageFromGallery();
  Future<Result<String>> captureImageFromCamera();
  Future<Result<GeoPoint>> getCurrentLocation();
  Future<Result<void>> shareText(String text);
  Future<Result<void>> openExternalUrl(String url);
  Stream<bool> watchOnline();
}

/// Coordenadas mínimas (sin acoplar a geolocator en el dominio).
class GeoPoint {
  const GeoPoint({required this.latitude, required this.longitude});
  final double latitude;
  final double longitude;
}
