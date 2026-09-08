-- Campos de catálogo/admin que faltaban en "products" (panel administrativo:
-- crear/editar/eliminar, precios en distintas divisas, galería de imágenes).
-- Todas las columnas son nullable o tienen DEFAULT, así que no rompen filas existentes.

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(8) NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS "original_price" NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS "discount_percent" INTEGER,
  ADD COLUMN IF NOT EXISTS "image_urls" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "stock_hint" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "ai_pitch" TEXT,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN "products"."currency" IS 'Código ISO de la divisa de price (EUR, MXN, ...)';
COMMENT ON COLUMN "products"."original_price" IS 'Precio de referencia antes de descuento, misma divisa que price';
COMMENT ON COLUMN "products"."discount_percent" IS 'Descuento mostrado en la ficha (0-100)';
COMMENT ON COLUMN "products"."image_urls" IS 'Galería de imágenes en orden (carrusel deslizable); si está vacío, la API cae a [image_url]';
COMMENT ON COLUMN "products"."tags" IS 'Etiquetas libres (color, estilo, material...)';
COMMENT ON COLUMN "products"."stock_hint" IS 'Texto libre de urgencia/disponibilidad (p. ej. "Quedan pocas unidades")';
COMMENT ON COLUMN "products"."ai_pitch" IS 'Copy corto de "por qué te lo recomienda la IA"';
COMMENT ON COLUMN "products"."is_active" IS 'false = oculto del catálogo público pero sigue existiendo/editable en el panel admin';

-- Backfill: los productos ya existentes con image_url pasan a tener también
-- su galería de 1 imagen, para que los consumidores de `imageUrls` no vean
-- una galería vacía en productos creados antes de esta migración.
UPDATE "products"
SET "image_urls" = ARRAY["image_url"]
WHERE "image_url" IS NOT NULL AND cardinality("image_urls") = 0;
