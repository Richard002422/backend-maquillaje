import environ

from .base import *  # noqa: F401,F403

env = environ.Env()

DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

# Detrás del gateway Nginx (que ya termina TLS/reenvía por red interna), pero
# se dejan explícitas por si este servicio alguna vez queda expuesto directo.
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=False)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
