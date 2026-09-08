from django.apps import AppConfig


class SessionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sessions"
    verbose_name = "Sesiones del probador"
    label = "tryon_sessions"  # evita choque de nombre con django.contrib.sessions
