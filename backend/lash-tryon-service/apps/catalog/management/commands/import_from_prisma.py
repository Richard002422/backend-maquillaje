"""
Importa el catálogo de pestañas ya sembrado en el Postgres de backend/api
(Prisma — ver prisma/seedLashProducts.ts) hacia este servicio.

Es una migración de datos ÚNICA, no una integración permanente entre las dos
bases — después de esta fase, backend/api deja de ser la fuente de verdad
del catálogo de pestañas (lo es este servicio). Es segura de re-ejecutar
(usa update_or_create por id), por si hace falta repetirla tras corregir algo
del lado de Prisma antes del corte definitivo.

Uso:
    SOURCE_DATABASE_URL=postgresql://user:pass@host:5432/dbname \
        python manage.py import_from_prisma
"""

import os

import psycopg
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import AIModel, AIModelVersion, LashAsset, LashProduct

LASH_CATEGORY = "Pestañas"

# Debe coincidir con lo que estaba vigente en
# frontend/src/features/lash-tryon/faceDetector.ts (TASKS_VISION_VERSION) en
# el momento en que se sembraron estos datos (Fase 4 de la conversación
# original). Si la versión cambió desde entonces, NO reimportar a ciegas
# asumiendo que sigue siendo la misma — crear una AIModelVersion nueva y
# revisar a mano si los LashAsset existentes deben re-versionarse.
SOURCE_AI_MODEL_NAME = "mediapipe-face-landmarker"
SOURCE_AI_MODEL_VERSION_LABEL = "1.0.1-float16"

SELECT_QUERY = """
    SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url,
           a.overlay_url, a.canvas_width, a.canvas_height,
           a.anchor_inner_x, a.anchor_inner_y,
           a.anchor_outer_x, a.anchor_outer_y, a.eye_width_ref_px
    FROM products p
    JOIN lash_overlay_assets a ON a.product_id = p.id
    WHERE p.category = %s
"""


class Command(BaseCommand):
    help = "Importa el catálogo de pestañas desde el Postgres de backend/api (Prisma) a este servicio."

    def handle(self, *args, **options):
        source_url = os.environ.get("SOURCE_DATABASE_URL")
        if not source_url:
            raise CommandError(
                "Falta SOURCE_DATABASE_URL (el Postgres de backend/api). "
                "No es una variable de entorno permanente del servicio — solo se usa "
                "para esta importación puntual, no la agregues a .env."
            )

        ai_model_version = self._ensure_ai_model_version()

        self.stdout.write("Conectando a la base origen...")
        try:
            with psycopg.connect(source_url, connect_timeout=10) as conn, conn.cursor() as cur:
                cur.execute(SELECT_QUERY, (LASH_CATEGORY,))
                rows = cur.fetchall()
        except psycopg.OperationalError as exc:
            raise CommandError(f"No se pudo conectar a SOURCE_DATABASE_URL: {exc}") from exc

        if not rows:
            self.stdout.write(
                self.style.WARNING(
                    "0 productos encontrados en el origen (category='Pestañas' con overlay). "
                    "¿Ya corriste prisma/seedLashProducts.ts del lado de backend/api?"
                )
            )
            return

        imported = 0
        with transaction.atomic():
            for row in rows:
                self._import_row(row, ai_model_version)
                imported += 1

        self.stdout.write(self.style.SUCCESS(f"Importados {imported} productos con su overlay."))
        self.stdout.write(
            self.style.WARNING(
                "Campo 'style' importado en blanco (no existía en el origen) — "
                "complétalo desde /admin/ para que el buscador/filtro del catálogo lo aproveche."
            )
        )

    def _ensure_ai_model_version(self) -> AIModelVersion:
        ai_model, _ = AIModel.objects.get_or_create(
            name=SOURCE_AI_MODEL_NAME,
            defaults={
                "description": (
                    "MediaPipe Tasks Vision Face Landmarker. Procesamiento 100% en el "
                    "dispositivo (navegador) — este servicio nunca ejecuta inferencia."
                )
            },
        )
        ai_model_version, created = AIModelVersion.objects.get_or_create(
            ai_model=ai_model,
            version_label=SOURCE_AI_MODEL_VERSION_LABEL,
            defaults={"is_default": True, "notes": "Importado junto con el catálogo original (Fase 4→1)."},
        )
        if created:
            self.stdout.write(f"Creada AIModelVersion {ai_model_version}")
        return ai_model_version

    def _import_row(self, row: tuple, ai_model_version: AIModelVersion) -> None:
        (
            product_id,
            name,
            description,
            price,
            stock,
            image_url,
            overlay_url,
            canvas_width,
            canvas_height,
            anchor_inner_x,
            anchor_inner_y,
            anchor_outer_x,
            anchor_outer_y,
            eye_width_ref_px,
        ) = row

        # Reutiliza el MISMO id (UUID) que ya tenía en Prisma — ver docstring
        # de LashProduct en models.py para el porqué: el carrito del frontend
        # puede tener referencias a este id de pruebas anteriores.
        product, _ = LashProduct.objects.update_or_create(
            id=product_id,
            defaults={
                "name": name,
                "description": description or "",
                "price": price,
                "stock": stock,
                "thumbnail_url": image_url or "",
                "active": True,
            },
        )
        LashAsset.objects.update_or_create(
            product=product,
            defaults={
                "overlay_url": overlay_url,
                "canvas_width": canvas_width,
                "canvas_height": canvas_height,
                "anchor_inner_x": anchor_inner_x,
                "anchor_inner_y": anchor_inner_y,
                "anchor_outer_x": anchor_outer_x,
                "anchor_outer_y": anchor_outer_y,
                "eye_width_ref_px": eye_width_ref_px,
                "ai_model_version": ai_model_version,
                "active": True,
            },
        )
