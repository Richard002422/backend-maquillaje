from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def healthz(request):
    # Sin autenticación a propósito: lo consulta el healthcheck de Docker y
    # el orquestador, no debe depender de que el JWT compartido esté bien
    # configurado para saber si el proceso está vivo.
    return JsonResponse({"status": "ok", "service": "lash-tryon-service"})
