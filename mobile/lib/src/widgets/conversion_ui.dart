import 'package:flutter/material.dart';

/// Franja de confianza (autoridad + reducción de fricción).
class TrustStrip extends StatelessWidget {
  const TrustStrip({super.key});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme.labelMedium;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceEvenly,
        spacing: 16,
        runSpacing: 8,
        children: [
          _item(Icons.lock_outline, 'Pago seguro', t),
          _item(Icons.local_shipping_outlined, 'Envío 48h', t),
          _item(Icons.restart_alt, 'Devolución 30 días', t),
        ],
      ),
    );
  }

  Widget _item(IconData i, String label, TextStyle? t) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(i, size: 18),
        const SizedBox(width: 6),
        Text(label, style: t),
      ],
    );
  }
}

/// Prueba social + urgencia suave (sin cifras falsas: copy genérico).
class SocialProofPulse extends StatelessWidget {
  const SocialProofPulse({super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(Icons.visibility_outlined, color: Theme.of(context).colorScheme.primary),
      title: const Text('Alta actividad ahora'),
      subtitle: const Text(
        'Muchas personas están probando looks en AR. Únete para no quedarte fuera de las novedades.',
        style: TextStyle(fontSize: 13),
      ),
    );
  }
}
