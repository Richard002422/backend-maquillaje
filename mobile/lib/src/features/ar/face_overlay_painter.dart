import 'package:flutter/material.dart';

/// Guía facial estática hasta integrar ML Kit / MediaPipe (mesh + tracking).
class FaceGuideOverlayPainter extends CustomPainter {
  FaceGuideOverlayPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    final cx = size.width / 2;
    final cy = size.height * 0.42;
    final w = size.width * 0.55;
    final h = size.height * 0.52;
    final r = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(cx, cy), width: w, height: h),
      const Radius.circular(48),
    );
    canvas.drawRRect(r, paint);

    final dashPaint = Paint()
      ..color = color.withValues(alpha: 0.35)
      ..strokeWidth = 1.2;
    canvas.drawLine(Offset(cx, cy - h / 2 - 24), Offset(cx, cy - h / 2 - 8), dashPaint);
  }

  @override
  bool shouldRepaint(covariant FaceGuideOverlayPainter oldDelegate) =>
      oldDelegate.color != color;
}
