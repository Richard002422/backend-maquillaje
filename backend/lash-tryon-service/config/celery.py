import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("lash_tryon_service")
# Lee CELERY_* de settings.py (namespace evita colisión con otras variables).
app.config_from_object("django.conf:settings", namespace="CELERY")
# Busca un módulo tasks.py dentro de cada app listada en INSTALLED_APPS.
app.autodiscover_tasks()
