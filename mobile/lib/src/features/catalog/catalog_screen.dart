import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../providers/catalog_providers.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = ref.watch(catalogQueryProvider);
    final categories = ref.watch(catalogCategoriesProvider);
    final products = ref.watch(filteredProductsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Catálogo')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Busca por nombre, categoría o tag…',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                isDense: true,
              ),
              onChanged: ref.read(catalogQueryProvider.notifier).setSearch,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: const Text('Todas'),
                    selected: q.category == null,
                    onSelected: (_) => ref.read(catalogQueryProvider.notifier).clearCategory(),
                  ),
                ),
                ...categories.map(
                  (c) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: FilterChip(
                      label: Text(c),
                      selected: q.category == c,
                      onSelected: (_) => ref.read(catalogQueryProvider.notifier).toggleCategory(c),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Precio máx. ${q.maxPrice.round()} €',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                ),
                Text('${products.length} resultados', style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          ),
          Slider(
            value: q.maxPrice,
            min: 15,
            max: 80,
            divisions: 65,
            label: '${q.maxPrice.round()} €',
            onChanged: ref.read(catalogQueryProvider.notifier).setMaxPrice,
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.72,
              ),
              itemCount: products.length,
              itemBuilder: (context, i) {
                final p = products[i];
                return _ProductTile(product: p);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    return Material(
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      color: Theme.of(context).colorScheme.surfaceContainerLow,
      child: InkWell(
        onTap: () => context.push('/producto/${product.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Image.network(
                product.imageUrls.first,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFFe8d5cf)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${product.priceEur.toStringAsFixed(2)} € · ${product.category}',
                    style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
