"""
Settings compartidos entre dev y prod. No se usa directamente como
DJANGO_SETTINGS_MODULE — ver dev.py / prod.py, que lo importan con `from
.base import *`.
"""

from pathlib import Path

import environ

# .../lash-tryon-service/config/settings/base.py -> sube 3 niveles = raíz del servicio
BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(str(env_file))

SECRET_KEY = env("DJANGO_SECRET_KEY")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.core",
    "apps.catalog",
    "apps.sessions",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        # APP_DIRS=True es lo que necesita el admin de Django para sus propias
        # plantillas; este servicio no añade plantillas propias (es una API).
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    # django-environ parsea DATABASE_URL igual que el resto del backend
    # (formato postgresql://user:pass@host:port/nombre).
    "default": env.db("DATABASE_URL"),
}

AUTH_PASSWORD_VALIDATORS = [
    # Solo aplica a cuentas de staff del admin de Django — ver README.md.
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Django REST Framework ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.core.authentication.ExpressJWTAuthentication",
    ],
    # Autenticado por defecto: las vistas de solo-lectura del catálogo (Fase 1+)
    # deben marcarse explícitamente AllowAny, no al revés — evita exponer un
    # endpoint nuevo sin querer.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

# --- JWT compartido con Express (backend/api/src/lib/jwt.ts) ---
# Son constantes del protocolo, no configuración por entorno: si cambian acá
# tienen que cambiar idénticas del lado de Express, así que se fijan en
# código (no en .env) para que un typo en una variable de entorno no las
# desincronice en silencio.
JWT_ACCESS_SECRET = env("JWT_ACCESS_SECRET")
JWT_ISSUER = "glowlab-api"
JWT_AUDIENCE = "glowlab-clients"

# --- CORS ---
# Mismo comportamiento que backend/api/src/app.ts: sin CORS_ORIGIN configurado,
# refleja cualquier origen (conveniente en dev; en prod SIEMPRE configurar
# CORS_ORIGIN explícito).
CORS_ALLOWED_ORIGINS = env.list("CORS_ORIGIN", default=[])
CORS_ALLOW_ALL_ORIGINS = len(CORS_ALLOWED_ORIGINS) == 0

# --- Celery ---
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
