import 'package:connectivity_plus/connectivity_plus.dart';

/// Observabilidad de red (online/offline) → Bridge NETWORK_CHANGED.
abstract class IConnectivityService {
  Stream<bool> get onStatusChange;
  Future<bool> get isOnline;
}

class ConnectivityService implements IConnectivityService {
  ConnectivityService({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  bool _onlineFrom(List<ConnectivityResult> results) {
    if (results.isEmpty) return false;
    return results.any((r) => r != ConnectivityResult.none);
  }

  @override
  Stream<bool> get onStatusChange =>
      _connectivity.onConnectivityChanged.map(_onlineFrom);

  @override
  Future<bool> get isOnline async {
    final results = await _connectivity.checkConnectivity();
    return _onlineFrom(results);
  }
}

class ConnectivityServiceStub implements IConnectivityService {
  @override
  Stream<bool> get onStatusChange => Stream<bool>.value(true);

  @override
  Future<bool> get isOnline async => true;
}
