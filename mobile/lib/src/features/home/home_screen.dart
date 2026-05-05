import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../providers/catalog_providers.dart';
import '../../providers/prefs_providers.dart';
import '../../providers/recommendations_provider.dart';
import '../../widgets/conversion_ui.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rec = ref.watch(recommendationsProvider);
    final all = ref.watch(allProductsProvider);
    final featured = all.firstWhere(
      (p) => p.id == 'serum-brillo',
      orElse: () => all.first,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('GlowLab'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            'Tu maquillaje, en tiempo real',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Prueba AR, recomendaciones con IA y catálogo pensado para decidir rápido.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 20),
          const TrustStrip(),
          const SizedBox(height: 16),
          const SocialProofPulse(),
          const SizedBox(height: 20),
          _FeaturedCard(product: featured, onOpen: () => context.push('/producto/${featured.id}')),
          const SizedBox(height: 24),
          Text('Tu estilo (memoria local)', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _lookChip(context, ref, 'natural', 'Glow natural'),
              _lookChip(context, ref, 'fiesta', 'Noche'),
              _lookChip(context, ref, 'editorial', 'Editorial'),
              _lookChip(context, ref, 'minimal', 'Clean girl'),
            ],
          ),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recomendado para ti', style: Theme.of(context).textTheme.titleMedium),
              TextButton(onPressed: () => context.go('/catalogo'), child: const Text('Ver todo')),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 216,
            child: rec.when(
              data: (list) => ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => _RecoCard(product: list[i]),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('No se pudieron cargar recomendaciones.'),
            ),
          ),
          const SizedBox(height: 28),
          FilledButton.icon(
            onPressed: () => context.go('/ar'),
            icon: const Icon(Icons.face_retouching_natural),
            label: const Text('Probar maquillaje AR en vivo'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => context.go('/catalogo'),
            icon: const Icon(Icons.search),
            label: const Text('Buscar con filtros inteligentes'),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
        ],
      ),
    );
  }

  Widget _lookChip(BuildContext context, WidgetRef ref, String id, String label) {
    final active = ref.watch(lastLookIdProvider) == id;
    return FilterChip(
      label: Text(label),
      selected: active,
      onSelected: (_) async {
        await ref.read(lastLookIdProvider.notifier).setLook(id);
        ref.invalidate(recommendationsProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Estilo «$label» guardado. Recomendaciones actualizadas.')),
          );
        }
      },
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({required this.product, required this.onOpen});

  final Product product;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final pct = product.discountPercent;
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  product.imageUrls.first,
                  width: 96,
                  height: 120,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox(
                    width: 96,
                    height: 120,
                    child: ColoredBox(color: Color(0xFFe8c4b8)),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (pct != null)
                      Chip(
                        label: Text('–$pct% hoy'),
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    if (product.stockHint != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        product.stockHint!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(product.name, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text('${product.priceEur.toStringAsFixed(2)} €', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Text(
                      'CTA principal: un toque para ver detalle, carousel y añadir al carrito.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecoCard extends StatelessWidget {
  const _RecoCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      child: Material(
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        color: Theme.of(context).colorScheme.surface,
        child: InkWell(
          onTap: () => context.push('/producto/${product.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: Image.network(
                  product.imageUrls.first,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFFdcc8c2)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Text('IA · ${product.category}', style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.primary)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
