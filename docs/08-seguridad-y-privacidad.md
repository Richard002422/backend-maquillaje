# 08 — Seguridad, privacidad y aspectos regulatorios

## 8.1 Superficie de datos sensibles

| Dato | Origen | Riesgo | Mitigación mínima |
|------|--------|--------|-------------------|
| Imagen / vídeo del rostro | Cámara, galería | **Biometría proxy**; reidentificación | Consentimiento explícito; procesamiento on-device cuando sea posible; TTL corto en servidor. |
| Identificadores de producto y carrito | App + API | Bajo | HTTPS; no loguear payloads completos en analytics. |
| Tokens de sesión / OAuth | API | Alto | Keychain (iOS) / EncryptedSharedPreferences (Android); rotación; scopes mínimos. |

## 8.2 Transporte

- **TLS 1.2+** obligatorio en producción; **certificate pinning** opcional si hay riesgo de MITM en mercados objetivo.
- Cabecera **HSTS** en dominios API y CDN.

## 8.3 Almacenamiento local (Hive)

- Los datos en `prefs` son **accesibles al proceso** de la app; no sustituyen cifrado frente a extracción forense del dispositivo.
- Para secretos (refresh tokens), usar **flutter_secure_storage** o almacén nativo cifrado.

## 8.4 Permisos de plataforma

- **Cámara:** justificar en copy legal y en `Info.plist` / Play Data safety form.
- **Red:** solo `INTERNET` no implica acceso a LAN en Android 12+; documentar si se añade `NEARBY_WIFI_DEVICES` u otros.

## 8.5 Cumplimiento (marco orientativo)

> Texto orientativo, no asesoría legal.

- **GDPR / RGPD (UE):** base legal (consentimiento / contrato), DPA con proveedores de IA, derecho de supresión, registro de actividades de tratamiento.
- **Menores:** flujos de maquillaje AR pueden dirigirse a audiencias jóvenes; revisar edad mínima y parental controls según mercado.

## 8.6 Influencers y enlaces externos

`url_launcher` abre apps o navegador externo. Riesgos:

- **Phishing** si las URLs son configurables sin validación.
- **Tracking** por query params en enlaces de afiliado — declarar en política de privacidad.

Mitigación: lista blanca de dominios (`tiktok.com`, `instagram.com`, dominios propios de campaña).

## 8.7 Checklist pre-release

- [ ] Política de privacidad enlazada desde stores y web.
- [ ] Flujo de borrado de cuenta / datos (si hay login).
- [ ] DPIA si se procesan imágenes faciales a escala en servidor.
- [ ] Retención y borrado de assets en bucket (lifecycle S3).
- [ ] Registro de versiones de modelo de IA para auditoría.
