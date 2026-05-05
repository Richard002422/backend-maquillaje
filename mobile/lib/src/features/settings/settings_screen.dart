import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/prefs_providers.dart';
import '../../providers/recommendations_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ajustes'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(
            decoration: const InputDecoration(
              labelText: 'ID de look de prueba (Hive)',
              border: OutlineInputBorder(),
            ),
            onSubmitted: (v) async {
              final trimmed = v.trim();
              await ref.read(lastLookIdProvider.notifier).setLook(
                    trimmed.isEmpty ? null : trimmed,
                  );
              ref.invalidate(recommendationsProvider);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Guardado en caja local')),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
