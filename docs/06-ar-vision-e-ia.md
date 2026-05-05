# 06 — AR, visión por computador e IA

## 6.1 Objetivo técnico

Construir un **pipeline en tiempo (o casi tiempo) real** que:

1. **Capture** fotogramas desde la cámara frontal.
2. **Estime** la pose y geometría del rostro (landmarks 2D/3D).
3. **Segmente** regiones cosméticas (labios, párpados, mejillas, cejas).
4. **Renderice** capas de color/textura (shaders o composición 2D) alineadas al movimiento.
5. **Opcional:** envíe fotogramas o embeddings a **servicio IA** para looks generativos o asesoramiento.

En el código actual, los pasos 2–4 están **stubbed**: hay cámara + guía visual estática (`FaceGuideOverlayPainter`).

## 6.2 Implementación actual en Flutter

| Componente | Archivo | Notas |
|------------|---------|-------|
| Permisos | `ArTryOnScreen` | `permission_handler` solicita `Permission.camera`. |
| Preview | `camera` | `CameraController` con `ResolutionPreset.medium`, `enableAudio: false`. |
| Guía | `face_overlay_painter.dart` | Óvalo y línea guía; sustituir por geometría proyectada desde landmarks. |
| CTA demo | SnackBar | Punto de enganche para encolar `CameraImage` al motor nativo o al isolate de procesamiento. |

## 6.3 Opciones de motor de visión (móvil)

### Google ML Kit Face Detection

- **Pros:** integración relativamente directa en Android/iOS; modelos optimizados; detección de rostros y landmarks en 2D.
- **Contras:** políticas de datos y dependencia de servicios Google en algunos componentes; revisar modo **on-device** vs cloud según módulo.

**Integración típica:** plugin `google_mlkit_face_detection` + `InputImage.fromBytes` construido desde el stream de `camera` (YUV → NV21/Bitmap en Android, `CMSampleBuffer` en iOS). Procesar en **isolate** para no bloquear UI.

### MediaPipe Face Landmarker

- **Pros:** pipeline unificado, útil si se desea **misma lógica** en Python (servidor) y móvil (C++/JNI vía bindings).
- **Contras:** curva de integración más alta en Flutter (FFI o plugins comunitarios).

## 6.4 Flutter Web y cámara

Flutter Web no expone el mismo stack nativo que Android/iOS. Opciones:

- **WebRTC** (`getUserMedia`) + procesamiento en **WebAssembly** (OpenCV compilado, MediaPipe JS) dentro de un `HtmlElementView` o `dart:js_interop`.
- **Degradación controlada:** en `kIsWeb`, mostrar flujo “sube foto” (como la SPA Vite) en lugar de preview continuo.

Documente la **matriz de capacidades** por plataforma en el README de producto.

## 6.5 Recomendaciones IA (lado servidor vs on-device)

| Enfoque | Cuándo usar | Consideraciones |
|---------|-------------|-------------------|
| Servidor (REST) | Modelos grandes, A/B, control de coste | Latencia red; privacidad (no enviar biometría sin consentimiento). |
| On-device (TFLite / Core ML) | Baja latencia, offline parcial | Tamaño de app; actualización de modelos OTA con firma. |
| Híbrido | Detección local + refinamiento cloud | Particionar PII: enviar **embeddings** en lugar de píxeles cuando sea posible. |

El código actual implementa **servidor opcional** + **heurística local** en `recommendations_provider.dart`.

## 6.6 Métricas de calidad AR

- **FPS** de procesamiento vs **FPS** de UI (objetivo: decouple con ring buffer).
- **Jitter** de landmarks (suavizado Kalman / One Euro Filter).
- **Consumo energético** (profile con DevTools + Android Profiler).

## 6.7 Privacidad de imagen

Ver capítulo 08. Regla de oro: **minimizar retención** de fotogramas; procesar en memoria volátil y borrar buffers al salir de `ArTryOnScreen.dispose()`.
