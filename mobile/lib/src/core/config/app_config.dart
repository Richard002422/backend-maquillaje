/// Configuración de entorno inyectada en compile-time.
///
/// ## Desarrollo (Paso 2)
///
/// ```bash
/// flutter run --flavor dev --dart-define-from-file=config/dev.json
/// flutter run --flavor prod --dart-define-from-file=config/prod.json
/// ```
///
/// **Gradle flavor** (`dev`/`prod`) controla applicationId, nombre en launcher
/// y cleartext HTTP. **`APP_FLAVOR` en dart-define** debe coincidir; si no,
/// logs/feature flags Dart mentirán aunque el APK sea el flavor correcto.
///
/// **Por qué dos capas (Gradle + dart-define):**
/// - Gradle no puede inyectar URLs Dart de forma portable sin plugins extra.
/// - dart-define embebe strings en el kernel snapshot (seguro para no leer `.env` en runtime).
class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.webBaseUrl,
    required this.flavor,
    required this.bridgeProtocolVersion,
  });

  /// Base del API Express (sin slash final).
  final String apiBaseUrl;

  /// Origen del SPA Vite servido dentro del WebView (Paso 4+).
  final String webBaseUrl;

  /// Etiqueta lógica: `dev` | `prod` (debe alinearse con `--flavor`).
  final String flavor;

  /// Versión del contrato JSON Flutter ↔ JS.
  final int bridgeProtocolVersion;

  bool get isProd => flavor == 'prod';
  bool get isDev => flavor == 'dev';

  /// Factory que lee `--dart-define` / `--dart-define-from-file`.
  static AppConfig fromEnvironment() {
    const api = String.fromEnvironment(
      'API_BASE',
      defaultValue: 'http://10.0.2.2:4000',
    );
    const web = String.fromEnvironment(
      'WEB_BASE_URL',
      defaultValue: 'http://10.0.2.2:5173',
    );
    const flavor = String.fromEnvironment(
      'APP_FLAVOR',
      defaultValue: 'dev',
    );
    return AppConfig(
      apiBaseUrl: _stripTrailingSlash(api),
      webBaseUrl: _stripTrailingSlash(web),
      flavor: flavor,
      bridgeProtocolVersion: 1,
    );
  }

  static String _stripTrailingSlash(String value) {
    if (value.endsWith('/')) {
      return value.substring(0, value.length - 1);
    }
    return value;
  }
}
