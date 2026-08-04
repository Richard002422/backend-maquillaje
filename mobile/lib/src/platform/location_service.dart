import 'package:geolocator/geolocator.dart';

import '../domain/repositories/device_capability_gateway.dart';

/// GPS when-in-use. Pedir permiso solo al invocar (no al cold start).
abstract class ILocationService {
  Future<GeoPoint?> getCurrentPosition();
  Future<bool> isServiceEnabled();
}

class LocationService implements ILocationService {
  @override
  Future<bool> isServiceEnabled() => Geolocator.isLocationServiceEnabled();

  @override
  Future<GeoPoint?> getCurrentPosition() async {
    final enabled = await isServiceEnabled();
    if (!enabled) return null;

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 20),
      ),
    );
    return GeoPoint(latitude: position.latitude, longitude: position.longitude);
  }
}

class LocationServiceStub implements ILocationService {
  @override
  Future<GeoPoint?> getCurrentPosition() async => null;

  @override
  Future<bool> isServiceEnabled() async => false;
}
