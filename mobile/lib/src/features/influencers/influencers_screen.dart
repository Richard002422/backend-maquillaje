import 'package:flutter/material.dart';

import '../../data/influencers_seed.dart';
import '../../data/models/influencer.dart';
import '../../services/launch_urls.dart';

class InfluencersScreen extends StatelessWidget {
  const InfluencersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Creators')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: kInfluencers.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final inf = kInfluencers[i];
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                child: Text(
                  inf.name.isNotEmpty ? inf.name[0].toUpperCase() : '?',
                  style: TextStyle(color: Theme.of(context).colorScheme.onPrimaryContainer),
                ),
              ),
              title: Text(inf.name),
              subtitle: Text('${inf.handle} · ${inf.tagline}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _openSheet(context, inf),
            ),
          );
        },
      ),
    );
  }

  void _openSheet(BuildContext context, Influencer inf) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(inf.name, style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Abre contenido en TikTok e Instagram (enlaces de campaña / UGC).',
                style: Theme.of(ctx).textTheme.bodyMedium,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () => openExternalUrl(inf.tiktokUrl),
                icon: const Icon(Icons.music_note),
                label: const Text('TikTok'),
              ),
              const SizedBox(height: 10),
              FilledButton.tonalIcon(
                onPressed: () => openExternalUrl(inf.instagramUrl),
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Instagram'),
              ),
            ],
          ),
        );
      },
    );
  }
}
