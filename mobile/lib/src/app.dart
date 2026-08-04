import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'di/hybrid_providers.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class GlowLabApp extends ConsumerWidget {
  const GlowLabApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    final config = ref.watch(appConfigProvider);

    return MaterialApp.router(
      title: 'GlowLab',
      debugShowCheckedModeBanner: config.flavor != 'prod',
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
