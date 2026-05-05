import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/cart_line.dart';
import '../data/models/product.dart';
import '../data/products_seed.dart';
import 'api_providers.dart';
import 'cart_provider.dart';
import 'prefs_providers.dart';

/// Recomendaciones: intenta `/v1/recommendations` y cae a heurística local.
final recommendationsProvider = FutureProvider<List<Product>>((ref) async {
  final client = ref.watch(restClientProvider);
  final lastLook = ref.watch(lastLookIdProvider);
  final cart = ref.watch(cartProvider);

  try {
    final json = await client.getJson('/v1/recommendations');
    final ids = (json['productIds'] as List<dynamic>?)?.map((e) => '$e').toList();
    if (ids != null && ids.isNotEmpty) {
      final out = <Product>[];
      for (final id in ids) {
        final p = productById(id);
        if (p != null) out.add(p);
      }
      if (out.isNotEmpty) return out;
    }
  } on Object {
    // API no disponible: heurística offline
  }

  return _localHeuristic(lastLook, cart);
});

List<Product> _localHeuristic(String? lastLook, List<CartLine> cart) {
  final cartIds = cart.map((e) => e.productId).toSet();
  final scored = <Product, int>{};
  for (final p in kSeedProducts) {
    var s = 0;
    if (p.aiPitch != null) s += 2;
    if (lastLook == 'natural' && p.tags.any((t) => t.contains('lumin'))) s += 3;
    if (lastLook == 'minimal' && p.tags.any((t) => t.contains('natural') || t.contains('fresco'))) s += 2;
    if (lastLook == 'fiesta' && p.category == 'Ojos') s += 3;
    if (lastLook == 'editorial' && p.tags.contains('editorial')) s += 3;
    if (cartIds.contains(p.id)) s -= 5;
    if (p.discountPercent != null) s += 1;
    scored[p] = s;
  }
  final list = scored.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
  return list.take(5).map((e) => e.key).toList();
}
