import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import 'face_overlay_painter.dart';

/// Vista previa en vivo + guía AR. Sustituye el overlay por landmarks reales
/// cuando conectes ML Kit o MediaPipe Face Landmarker.
class ArTryOnScreen extends StatefulWidget {
  const ArTryOnScreen({super.key});

  @override
  State<ArTryOnScreen> createState() => _ArTryOnScreenState();
}

class _ArTryOnScreenState extends State<ArTryOnScreen> {
  CameraController? _camera;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final status = await Permission.camera.request();
      if (!status.isGranted) {
        setState(() {
          _error = 'Permiso de cámara denegado. Actívalo en ajustes del sistema.';
          _busy = false;
        });
        return;
      }
      final cams = await availableCameras();
      if (cams.isEmpty) {
        setState(() {
          _error = 'No hay cámaras disponibles en este dispositivo.';
          _busy = false;
        });
        return;
      }
      final front = cams.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cams.first,
      );
      final controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _camera = controller;
        _busy = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'No se pudo iniciar la cámara: $e';
          _busy = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _camera?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Prueba AR en vivo')),
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_camera != null && _camera!.value.isInitialized)
            Positioned.fill(
              child: FittedBox(
                fit: BoxFit.cover,
                clipBehavior: Clip.hardEdge,
                child: SizedBox(
                  width: _camera!.value.previewSize!.width,
                  height: _camera!.value.previewSize!.height,
                  child: CameraPreview(_camera!),
                ),
              ),
            ),
          if (_camera != null && _camera!.value.isInitialized)
            CustomPaint(
              painter: FaceGuideOverlayPainter(color: scheme.primary.withValues(alpha: 0.95)),
              child: const SizedBox.expand(),
            ),
          if (_camera != null && _camera!.value.isInitialized)
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black.withValues(alpha: 0.75)],
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Visión por computadora: aquí se procesa cada frame (detección facial, '
                      'segmentación labios/párpados) y se superpone el maquillaje. Activa ML Kit o MediaPipe.',
                      style: TextStyle(color: Colors.white, fontSize: 13, height: 1.35),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Simulación: enviarías el frame al motor CV y recibirías máscaras AR.',
                            ),
                          ),
                        );
                      },
                      child: const Text('Aplicar look virtual (demo)'),
                    ),
                  ],
                ),
              ),
            ),
          if (_busy) const ColoredBox(color: Colors.black26, child: Center(child: CircularProgressIndicator())),
          if (_error != null)
            ColoredBox(
              color: Theme.of(context).colorScheme.surface,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _initCamera, child: const Text('Reintentar')),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
