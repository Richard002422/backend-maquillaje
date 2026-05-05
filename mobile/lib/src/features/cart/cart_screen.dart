import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/products_seed.dart';
import '../../providers/cart_provider.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lines = ref.watch(cartProvider);
    final total = ref.watch(cartTotalProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Carrito'),
        actions: [
          if (lines.isNotEmpty)
            TextButton(
              onPressed: () async {
                await ref.read(cartProvider.notifier).clear();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Carrito vaciado')));
                }
              },
              child: const Text('Vaciar'),
            ),
        ],
      ),
      body: lines.isEmpty
          ? Center(
              child: Text(
                'Tu carrito está vacío.\nExplora el catálogo o las recomendaciones.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: lines.length,
                    separatorBuilder: (_, __) => const Divider(height: 24),
                    itemBuilder: (_, i) {
                      final line = lines[i];
                      final p = productById(line.productId);
                      if (p == null) return const SizedBox.shrink();
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              p.imageUrls.first,
                              width: 72,
                              height: 88,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const SizedBox(
                                width: 72,
                                height: 88,
                                child: ColoredBox(color: Color(0xFFe8d5cf)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text('${p.priceEur.toStringAsFixed(2)} € / ud.'),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    IconButton(
                                      onPressed: () => ref
                                          .read(cartProvider.notifier)
                                          .setQuantity(line.productId, line.quantity - 1),
                                      icon: const Icon(Icons.remove_circle_outline),
                                    ),
                                    Text('${line.quantity}', style: Theme.of(context).textTheme.titleMedium),
                                    IconButton(
                                      onPressed: () => ref
                                          .read(cartProvider.notifier)
                                          .setQuantity(line.productId, line.quantity + 1),
                                      icon: const Icon(Icons.add_circle_outline),
                                    ),
                                    const Spacer(),
                                    IconButton(
                                      onPressed: () =>
                                          ref.read(cartProvider.notifier).removeProduct(line.productId),
                                      icon: const Icon(Icons.delete_outline),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                Material(
                  elevation: 8,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total', style: Theme.of(context).textTheme.titleMedium),
                            Text(
                              '${total.toStringAsFixed(2)} €',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Conecta aquí tu checkout / pasarela')),
                            );
                          },
                          child: const Text('Continuar (checkout)'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
