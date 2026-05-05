import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/cart_provider.dart';
import '../../providers/catalog_providers.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({required this.productId, super.key});

  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  late final PageController _pageController;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final product = ref.watch(productByIdProvider(widget.productId));
    if (product == null) {
      return Scaffold(
        appBar: AppBar(leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop())),
        body: const Center(child: Text('Producto no encontrado')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        title: Text(product.name),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: FilledButton.icon(
            onPressed: () async {
              await ref.read(cartProvider.notifier).addProduct(product.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Añadido al carrito · persiste al cerrar la app')),
                );
              }
            },
            icon: const Icon(Icons.shopping_bag_outlined),
            label: const Text('Añadir al carrito'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          AspectRatio(
            aspectRatio: 4 / 5,
            child: Stack(
              alignment: Alignment.bottomCenter,
              children: [
                PageView.builder(
                  controller: _pageController,
                  itemCount: product.imageUrls.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) {
                    return Image.network(
                      product.imageUrls[i],
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorBuilder: (_, __, ___) => ColoredBox(
                        color: Theme.of(context).colorScheme.surfaceContainerHighest,
                        child: const Icon(Icons.image_not_supported_outlined, size: 48),
                      ),
                    );
                  },
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      product.imageUrls.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: _page == i ? 18 : 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: _page == i ? Colors.white : Colors.white54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (product.discountPercent != null)
                  Chip(label: Text('–${product.discountPercent}% · oferta')),
                const SizedBox(height: 8),
                Text(
                  '${product.priceEur.toStringAsFixed(2)} €',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(product.category, style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: product.tags.map((t) => Chip(label: Text(t), visualDensity: VisualDensity.compact)).toList(),
                ),
                const SizedBox(height: 24),
                Text('Por qué la IA te lo recomienda', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  product.aiPitch ??
                      'Tu backend puede devolver copy personalizada según rostro, tono y carrito. '
                          'Aquí mostramos texto fijo hasta conectar el modelo.',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
