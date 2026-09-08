from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import AIModelVersion
from apps.core.authentication import OptionalExpressJWTAuthentication

from .models import VirtualTryOnSession
from .serializers import TryOnResultCreateSerializer, VirtualTryOnSessionSerializer


class VirtualTryOnSessionCreateView(generics.CreateAPIView):
    """
    POST /v1/lash-tryon/sessions/

    Auth OPCIONAL a propósito (OptionalExpressJWTAuthentication, no la
    estricta): abrir el probador y probarse estilos no requiere login, igual
    que el resto del probador — pero si hay un JWT válido, la sesión queda
    asociada al usuario para historial futuro.
    """

    serializer_class = VirtualTryOnSessionSerializer
    authentication_classes = [OptionalExpressJWTAuthentication]
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user
        user_id = user.id if getattr(user, "is_authenticated", False) else None
        # Versión de IA "actual" resuelta server-side -- el cliente no tiene
        # por qué saber cuál está marcada como default en el catálogo.
        default_version = AIModelVersion.objects.filter(is_default=True).order_by("-released_at").first()
        serializer.save(user_id=user_id, ai_model_version=default_version)


class VirtualTryOnSessionCloseView(APIView):
    """POST /v1/lash-tryon/sessions/{id}/close/ — idempotente."""

    authentication_classes = [OptionalExpressJWTAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            session = VirtualTryOnSession.objects.get(pk=pk)
        except VirtualTryOnSession.DoesNotExist as exc:
            raise NotFound("Sesión no encontrada") from exc

        if session.ended_at is None:
            session.ended_at = timezone.now()
            session.status = VirtualTryOnSession.Status.COMPLETED
            session.save(update_fields=["ended_at", "status"])

        return Response(VirtualTryOnSessionSerializer(session).data, status=status.HTTP_200_OK)


class TryOnResultCreateView(generics.CreateAPIView):
    """POST /v1/lash-tryon/sessions/{session_id}/results/"""

    serializer_class = TryOnResultCreateSerializer
    authentication_classes = [OptionalExpressJWTAuthentication]
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        try:
            session = VirtualTryOnSession.objects.get(pk=self.kwargs["session_id"])
        except VirtualTryOnSession.DoesNotExist as exc:
            raise NotFound("Sesión no encontrada") from exc
        serializer.save(session=session)
