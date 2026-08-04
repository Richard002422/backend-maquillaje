import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../di/hybrid_providers.dart';
import '../services/rest_client.dart';

/// Cliente REST alineado con [AppConfig] (`--dart-define=API_BASE=...`).
final restClientProvider = Provider<RestClient>((ref) {
  final baseUrl = ref.watch(appConfigProvider).apiBaseUrl;
  final client = RestClient(baseUrl: baseUrl);
  ref.onDispose(client.close);
  return client;
});
