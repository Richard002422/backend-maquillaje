import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/cart_provider.dart';

class AppShell extends ConsumerWidget {
  const AppShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartProvider.select((l) => l.fold<int>(0, (a, b) => a + b.quantity)));

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (i) {
          navigationShell.goBranch(
            i,
            initialLocation: i == navigationShell.currentIndex,
          );
        },
        destinations: [
          const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Inicio'),
          const NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'Catálogo',
          ),
          const NavigationDestination(
            icon: Icon(Icons.face_retouching_natural_outlined),
            selectedIcon: Icon(Icons.face_retouching_natural),
            label: 'AR',
          ),
          NavigationDestination(
            icon: _badgeIcon(Icons.shopping_bag_outlined, cartCount),
            selectedIcon: _badgeIcon(Icons.shopping_bag, cartCount),
            label: 'Carrito',
          ),
          const NavigationDestination(
            icon: Icon(Icons.video_library_outlined),
            selectedIcon: Icon(Icons.video_library),
            label: 'Creators',
          ),
        ],
      ),
    );
  }

  Widget _badgeIcon(IconData icon, int count) {
    if (count <= 0) return Icon(icon);
    return Badge(
      label: Text('$count', style: const TextStyle(fontSize: 10)),
      child: Icon(icon),
    );
  }
}
