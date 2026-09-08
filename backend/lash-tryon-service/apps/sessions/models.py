"""
VirtualTryOnSession + TryOnResult — ver el documento de arquitectura (Fase 0)
para el modelo completo. Resumen de las decisiones que más importan acá:

- `user_id` es un CharField NULLABLE, no una FK a auth.User: puede haber
  sesiones anónimas (probarse pestañas no exige login, ver
  apps/core/authentication.py — OptionalExpressJWTAuthentication), y cuando
  sí hay usuario, es el `sub` (cuid) del JWT de Express, no una fila que
  Django posea.
- `TryOnResult.product` usa on_delete=PROTECT: no se puede borrar un
  LashProduct con historial de uso — para retirarlo del catálogo se usa
  `LashProduct.active=False` (ya existe para esto), no un borrado físico.
"""

import uuid

from django.db import models

from apps.catalog.models import AIModelVersion, LashProduct


class VirtualTryOnSession(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Activa"
        COMPLETED = "completed", "Completada"
        ABANDONED = "abandoned", "Abandonada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    # user_agent, is_native (WebView vs navegador), app_version, etc. —
    # telemetría de bajo costo, sin esquema fijo a propósito.
    device_info = models.JSONField(default=dict, blank=True)
    ai_model_version = models.ForeignKey(
        AIModelVersion,
        on_delete=models.PROTECT,
        related_name="sessions",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        db_table = "virtual_tryon_sessions"
        verbose_name = "Sesión del probador"
        verbose_name_plural = "Sesiones del probador"
        indexes = [
            # Paginación "mis sesiones" por cursor — mismo patrón que
            # TryOnPhoto en el diseño de la Fase 4.
            models.Index(fields=["user_id", "started_at"], name="idx_session_user_started"),
        ]

    def __str__(self) -> str:
        return f"Sesión {self.id} ({self.status})"


class TryOnResult(models.Model):
    """Un 'probé este producto' dentro de una sesión — puede haber varios por sesión (cambiar de estilo)."""

    session = models.ForeignKey(VirtualTryOnSession, on_delete=models.CASCADE, related_name="results")
    product = models.ForeignKey(LashProduct, on_delete=models.PROTECT, related_name="tryon_results")
    applied_at = models.DateTimeField(auto_now_add=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    avg_landmark_confidence = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "tryon_results"
        verbose_name = "Resultado de prueba"
        verbose_name_plural = "Resultados de prueba"
        indexes = [
            models.Index(fields=["session"], name="idx_result_session"),
            # Popularidad de producto — analytics de catálogo.
            models.Index(fields=["product", "applied_at"], name="idx_result_product_applied"),
        ]

    def __str__(self) -> str:
        return f"{self.product.name} en sesión {self.session_id}"
