from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Solo para cuentas de staff que administran el catálogo — ver README.md.
    path("admin/", admin.site.urls),
    # Chequeo de salud para Docker/orquestador. Deliberadamente FUERA de
    # /v1/lash-tryon/: lo consulta el propio contenedor/orquestador dentro de
    # la red interna, nunca pasa por el gateway público.
    path("healthz/", include("apps.core.urls")),
    # Mismo prefijo que ya usa el gateway Nginx para el resto del backend —
    # ver nginx.conf: location /v1/lash-tryon/.
    path("v1/lash-tryon/", include("apps.catalog.urls")),
    path("v1/lash-tryon/", include("apps.sessions.urls")),
    # Fotos (Fase 4) se agrega acá igual.
]
