import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/rest_client.dart';

/// Sustituye por URL real (dart-define, flavors o remote config).
const String kDefaultApiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'https://api.example.com',
);

final restClientProvider = Provider<RestClient>((ref) {
  final client = RestClient(baseUrl: kDefaultApiBase);
  ref.onDispose(client.close);
  return client;
});
