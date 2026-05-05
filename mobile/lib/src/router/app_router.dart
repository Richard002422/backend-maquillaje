import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/ar/ar_try_on_screen.dart';
import '../features/cart/cart_screen.dart';
import '../features/catalog/catalog_screen.dart';
import '../features/catalog/product_detail_screen.dart';
import '../features/home/home_screen.dart';
import '../features/influencers/influencers_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/shell/app_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final goRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/inicio',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/inicio',
                name: 'inicio',
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: HomeScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/catalogo',
                name: 'catalogo',
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: CatalogScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/ar',
                name: 'ar',
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: ArTryOnScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/carrito',
                name: 'carrito',
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: CartScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/influencers',
                name: 'influencers',
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: InfluencersScreen()),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/producto/:id',
        name: 'producto',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return ProductDetailScreen(productId: id);
        },
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});
