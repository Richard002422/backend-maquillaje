import os

from django.core.asgi import get_asgi_application

# No usado hoy (DRF corre por WSGI/gunicorn) — se deja listo por si en el
# futuro se necesita algo async (p. ej. WebSockets para progreso de subida en
# vivo en vez de polling). Ver config/wsgi.py para lo que realmente sirve tráfico.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_asgi_application()
