"""
Catálogo del dominio "Probador Virtual de Pestañas con IA" — ver el
documento de arquitectura (Fase 0 de la conversación) para el porqué de cada
decisión de modelado. Resumen de las que más importan:

- `LashProduct.id` es un UUID, a propósito el MISMO formato que ya usa
  `Product.id` en el Prisma de backend/api — al migrar datos existentes
  (ver management command `import_from_prisma`) se reutiliza el mismo id,
  para que cualquier referencia ya guardada en el carrito (localStorage del
  frontend) siga siendo válida sin cambios.
- `LashAsset` es 1:1 con `LashProduct` (no todo producto necesariamente
  tiene overlay AR — aunque en este dominio, en la práctica, todos deberían
  tenerlo), separado en su propia tabla en vez de columnas sueltas en
  LashProduct por la misma razón que en el diseño original de Prisma:
  mantiene el modelo de producto limpio y aísla los datos que sí se
  validan/consumen geométricamente.
- `AIModelVersion` en `LashAsset` (no en `LashProduct`) responde
  "versión del asset utilizado" Y "versión del motor de IA" con el mismo
  campo: el asset se diseñó/probó contra una versión concreta de
  MediaPipe Face Landmarker, y esa es la versión relevante para
  reproducibilidad si algún día hay que recalibrar anclas.
"""

import uuid

from django.db import models


class AIModel(models.Model):
    """Una familia de modelo de IA (p. ej. "MediaPipe Face Landmarker"), no una versión concreta."""

    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_models"
        verbose_name = "Modelo de IA"
        verbose_name_plural = "Modelos de IA"

    def __str__(self) -> str:
        return self.name


class AIModelVersion(models.Model):
    """Una versión concreta y trazable de un AIModel (p. ej. "1.0.1-float16")."""

    ai_model = models.ForeignKey(AIModel, on_delete=models.PROTECT, related_name="versions")
    version_label = models.CharField(max_length=60)
    # Enlace informativo al asset del modelo (p. ej. la URL del .task de
    # MediaPipe) — no se usa para servir nada, solo trazabilidad/auditoría.
    model_asset_url = models.URLField(blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    is_default = models.BooleanField(
        default=False,
        help_text="Versión que usan los LashAsset nuevos por defecto si no se especifica otra.",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_model_versions"
        verbose_name = "Versión de modelo de IA"
        verbose_name_plural = "Versiones de modelo de IA"
        constraints = [
            models.UniqueConstraint(fields=["ai_model", "version_label"], name="uniq_aimodel_version_label"),
        ]

    def __str__(self) -> str:
        return f"{self.ai_model.name} {self.version_label}"


class LashProduct(models.Model):
    class Style(models.TextChoices):
        NATURAL = "natural", "Natural"
        VOLUMEN = "volumen", "Volumen"
        DRAMATICO = "dramatico", "Dramático"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    # Foto de producto tal cual se muestra en la tienda — DISTINTA del
    # overlay_url de LashAsset (esa es el PNG usado para el AR, esta es la
    # miniatura de catálogo).
    thumbnail_url = models.URLField(blank=True)
    style = models.CharField(max_length=20, choices=Style.choices, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lash_products"
        verbose_name = "Producto de pestañas"
        verbose_name_plural = "Productos de pestañas"
        indexes = [
            models.Index(fields=["active", "style"], name="idx_lashprod_active_style"),
        ]

    def __str__(self) -> str:
        return self.name


class LashAsset(models.Model):
    """Metadatos del overlay AR de un LashProduct — ver lashTransform.ts en el frontend para cómo se consumen."""

    product = models.OneToOneField(
        LashProduct, on_delete=models.CASCADE, primary_key=True, related_name="asset"
    )
    # PNG-32 con alpha real. Ruta relativa (dev) o absoluta S3/CDN (prod) —
    # el cliente la usa tal cual como `src`.
    overlay_url = models.URLField()
    canvas_width = models.PositiveIntegerField()
    canvas_height = models.PositiveIntegerField()
    # Anclas normalizadas [0,1] respecto al lienzo (canvas_width x canvas_height).
    anchor_inner_x = models.FloatField()
    anchor_inner_y = models.FloatField()
    anchor_outer_x = models.FloatField()
    anchor_outer_y = models.FloatField()
    # Informativo/QA — no lo usa el motor de render (deriva el mismo valor
    # en vivo desde las anclas), pero sirve para detectar un asset subido
    # con anclas inconsistentes con el ancho de ojo para el que se diseñó.
    eye_width_ref_px = models.FloatField()
    ai_model_version = models.ForeignKey(
        AIModelVersion,
        on_delete=models.PROTECT,  # nunca borrar una versión mientras un asset la referencia
        related_name="lash_assets",
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "lash_assets"
        verbose_name = "Asset de pestañas (AR)"
        verbose_name_plural = "Assets de pestañas (AR)"

    def __str__(self) -> str:
        return f"Asset de {self.product.name}"
