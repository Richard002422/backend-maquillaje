import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/product.dart';
import '../data/products_seed.dart';

class CatalogQuery {
  const CatalogQuery({
    this.searchText = '',
    this.category,
    this.maxPrice = 100,
  });

  final String searchText;
  final String? category;
  final double maxPrice;
}

final catalogQueryProvider =
    NotifierProvider<CatalogQueryNotifier, CatalogQuery>(CatalogQueryNotifier.new);

class CatalogQueryNotifier extends Notifier<CatalogQuery> {
  @override
  CatalogQuery build() => const CatalogQuery();

  void setSearch(String v) {
    state = CatalogQuery(searchText: v, category: state.category, maxPrice: state.maxPrice);
  }

  void setMaxPrice(double v) {
    state = CatalogQuery(searchText: state.searchText, category: state.category, maxPrice: v);
  }

  void clearCategory() {
    state = CatalogQuery(searchText: state.searchText, category: null, maxPrice: state.maxPrice);
  }

  /// Toca de nuevo la misma categoría para quitar el filtro.
  void toggleCategory(String c) {
    final next = state.category == c ? null : c;
    state = CatalogQuery(searchText: state.searchText, category: next, maxPrice: state.maxPrice);
  }
}

final allProductsProvider = Provider<List<Product>>((ref) => kSeedProducts);

final catalogCategoriesProvider = Provider<List<String>>((ref) {
  final cats = ref.watch(allProductsProvider).map((e) => e.category).toSet().toList()..sort();
  return cats;
});

final filteredProductsProvider = Provider<List<Product>>((ref) {
  final q = ref.watch(catalogQueryProvider);
  final t = q.searchText.trim().toLowerCase();
  return ref.watch(allProductsProvider).where((p) {
    if (p.priceEur > q.maxPrice) return false;
    if (q.category != null && p.category != q.category) return false;
    if (t.isEmpty) return true;
    final inName = p.name.toLowerCase().contains(t);
    final inTags = p.tags.any((x) => x.toLowerCase().contains(t));
    final inCat = p.category.toLowerCase().contains(t);
    return inName || inTags || inCat;
  }).toList();
});

final productByIdProvider = Provider.family<Product?, String>((ref, id) {
  return productById(id);
});
