import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../di/hybrid_providers.dart';
import '../../domain/repositories/permission_repository.dart';
import '../../providers/prefs_providers.dart';
import '../../providers/recommendations_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _probe(
    BuildContext context,
    String label,
    Future<bool> Function() request,
    IPermissionService permissions,
  ) async {
    final granted = await request();
    if (!context.mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    if (granted) {
      messenger.showSnackBar(SnackBar(content: Text('$label: concedido')));
      return;
    }
    messenger.showSnackBar(
      SnackBar(
        content: Text('$label: denegado'),
        action: SnackBarAction(
          label: 'Ajustes',
          onPressed: () => permissions.openSystemSettings(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(permissionServiceProvider);

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
          const SizedBox(height: 32),
          Text('Producto web (Paso 4)', style: Theme.of(context).textTheme.titleMedium),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.language),
            title: const Text('Abrir WebView (frontend Vite)'),
            subtitle: Text(ref.watch(appConfigProvider).webBaseUrl),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/web'),
          ),
          const SizedBox(height: 24),
          Text('Permisos nativos (Paso 3)', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          const Text(
            'Se solicitan bajo demanda. No se piden todos al iniciar la app.',
            style: TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.photo_camera_outlined),
            title: const Text('Cámara'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _probe(context, 'Cámara', permissions.ensureCamera, permissions),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.photo_library_outlined),
            title: const Text('Galería / fotos'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _probe(context, 'Fotos', permissions.ensurePhotos, permissions),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.location_on_outlined),
            title: const Text('Ubicación'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _probe(
              context,
              'Ubicación',
              permissions.ensureLocationWhenInUse,
              permissions,
            ),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notificaciones'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _probe(
              context,
              'Notificaciones',
              permissions.ensureNotifications,
              permissions,
            ),
          ),
          const SizedBox(height: 24),
          Text('Nativo directo (Paso 8)', style: Theme.of(context).textTheme.titleMedium),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.ios_share),
            title: const Text('Compartir texto'),
            onTap: () async {
              await ref.read(shareServiceProvider).shareText(
                    'GlowLab — maquillaje con IA',
                    subject: 'GlowLab',
                  );
            },
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.open_in_browser),
            title: const Text('Abrir enlace externo'),
            onTap: () async {
              final ok = await ref.read(linkServiceProvider).openExternal('https://flutter.dev');
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ok ? 'Enlace abierto' : 'No se pudo abrir')),
                );
              }
            },
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.download),
            title: const Text('Descargar sample'),
            onTap: () async {
              final path = await ref.read(fileServiceProvider).downloadToAppDir(
                    url:
                        'https://flutter.github.io/assets-for-api-docs/assets/flutter-mark-square-100.png',
                    fileName: 'flutter-mark.png',
                  );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(path == null ? 'Descarga fallida' : 'OK: $path')),
                );
              }
            },
          ),
          const SizedBox(height: 24),
          Text('GPS y avisos (Paso 9)', style: Theme.of(context).textTheme.titleMedium),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.my_location),
            title: const Text('Obtener ubicación'),
            onTap: () async {
              final permissions = ref.read(permissionServiceProvider);
              final ok = await permissions.ensureLocationWhenInUse();
              if (!ok) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Ubicación denegada')),
                  );
                }
                return;
              }
              final point = await ref.read(locationServiceProvider).getCurrentPosition();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      point == null
                          ? 'Sin posición (¿GPS activo?)'
                          : '${point.latitude.toStringAsFixed(5)}, ${point.longitude.toStringAsFixed(5)}',
                    ),
                  ),
                );
              }
            },
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.notifications_active_outlined),
            title: const Text('Notificación local de prueba'),
            onTap: () async {
              final ok = await ref.read(notificationServiceProvider).showLocal(
                    title: 'GlowLab',
                    body: 'Notificación local OK (Paso 9). FCM pendiente de Firebase.',
                  );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ok ? 'Notificación enviada' : 'Permiso denegado')),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
