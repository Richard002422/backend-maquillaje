# Registra la app de Celery al importar el paquete config, para que las
# tareas @shared_task de futuras apps (apps/photos/tasks.py, Fase 4) se
# autodescubran sin configuración adicional.
from .celery import app as celery_app

__all__ = ("celery_app",)
