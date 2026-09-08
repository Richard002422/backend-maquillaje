import os

from django.core.wsgi import get_wsgi_application

# prod por defecto: es lo que arranca gunicorn en el contenedor (ver
# Dockerfile). manage.py usa dev.py para runserver local.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_wsgi_application()
