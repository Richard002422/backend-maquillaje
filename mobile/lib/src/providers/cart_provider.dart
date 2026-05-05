import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/cart_line.dart';
import '../data/products_seed.dart';
import 'prefs_providers.dart';

final cartProvider = NotifierProvider<CartNotifier, List<CartLine>>(CartNotifier.new);

class CartNotifier extends Notifier<List<CartLine>> {
  static const _key = 'cart_lines_v1';

  @override
  List<CartLine> build() {
    ref.watch(prefsBoxProvider);
    final box = ref.read(prefsBoxProvider);
    final raw = box.get(_key) as String?;
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => CartLine.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _persist(List<CartLine> next) async {
    final box = ref.read(prefsBoxProvider);
    final encoded = jsonEncode(next.map((e) => e.toJson()).toList());
    await box.put(_key, encoded);
    state = next;
  }

  Future<void> addProduct(String productId, {int quantity = 1}) async {
    final next = [...state];
    final i = next.indexWhere((e) => e.productId == productId);
    if (i >= 0) {
      next[i] = next[i].copyWith(quantity: next[i].quantity + quantity);
    } else {
      next.add(CartLine(productId: productId, quantity: quantity));
    }
    await _persist(next);
  }

  Future<void> setQuantity(String productId, int quantity) async {
    if (quantity <= 0) {
      await removeProduct(productId);
      return;
    }
    final next = state
        .map((e) => e.productId == productId ? e.copyWith(quantity: quantity) : e)
        .toList();
    await _persist(next);
  }

  Future<void> removeProduct(String productId) async {
    await _persist(state.where((e) => e.productId != productId).toList());
  }

  Future<void> clear() async {
    await _persist([]);
  }

  int get totalItems => state.fold(0, (a, b) => a + b.quantity);
}

final cartTotalProvider = Provider<double>((ref) {
  final lines = ref.watch(cartProvider);
  double sum = 0;
  for (final line in lines) {
    final p = productById(line.productId);
    if (p != null) sum += p.priceEur * line.quantity;
  }
  return sum;
});
