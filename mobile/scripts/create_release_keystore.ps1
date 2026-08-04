# Genera keystore de release GlowLab (Windows).
# Uso (desde mobile/):
#   pwsh ./scripts/create_release_keystore.ps1
#
# NO subas el .jks ni key.properties a git.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$keystoreDir = Join-Path $root "android\keystore"
$jks = Join-Path $keystoreDir "glowlab-release.jks"
$propsExample = Join-Path $root "android\key.properties.example"
$props = Join-Path $root "android\key.properties"

New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

if (Test-Path $jks) {
    Write-Host "Ya existe: $jks"
    Write-Host "Bórralo manualmente si quieres regenerar (perderás la firma anterior)."
    exit 1
}

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    Write-Error "keytool no está en PATH. Usa el JDK de Android Studio o JAVA_HOME."
}

Write-Host "Creando keystore en $jks ..."
& keytool -genkey -v `
    -keystore $jks `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -alias glowlab

if (-not (Test-Path $props)) {
    Copy-Item $propsExample $props
    Write-Host "Creado $props — edita storePassword y keyPassword."
} else {
    Write-Host "key.properties ya existe; no se sobrescribe."
}

Write-Host ""
Write-Host "Siguiente:"
Write-Host "  1. Edita android/key.properties con las contraseñas."
Write-Host "  2. Guarda una copia offline del .jks (si lo pierdes, no podrás actualizar la app)."
Write-Host "  3. flutter build appbundle --flavor prod --dart-define-from-file=config/prod.json --release"
