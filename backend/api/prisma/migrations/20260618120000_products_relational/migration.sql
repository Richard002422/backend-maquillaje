-- Catálogo relacional de productos (PostgreSQL)

CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" NUMERIC(12, 2) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(120) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");

-- Comentarios de columnas
COMMENT ON TABLE "products" IS 'Catálogo de productos GlowLab';
COMMENT ON COLUMN "products"."id" IS 'Identificador único del producto (UUID)';
COMMENT ON COLUMN "products"."name" IS 'Nombre comercial del producto';
COMMENT ON COLUMN "products"."price" IS 'Precio unitario (EUR)';
COMMENT ON COLUMN "products"."description" IS 'Descripción detallada';
COMMENT ON COLUMN "products"."category" IS 'Categoría (Labios, Ojos, Rostro, Skincare, etc.)';
COMMENT ON COLUMN "products"."stock" IS 'Unidades disponibles en inventario';
COMMENT ON COLUMN "products"."image_url" IS 'URL pública de la imagen (p. ej. Amazon S3)';

-- Ajuste de FKs: productId debe ser UUID
ALTER TABLE "RecommendationItem" DROP CONSTRAINT IF EXISTS "RecommendationItem_productId_fkey";
ALTER TABLE "MakeupTryOnSession" DROP CONSTRAINT IF EXISTS "MakeupTryOnSession_productId_fkey";
ALTER TABLE "RecommendationItem" ALTER COLUMN "productId" TYPE UUID USING NULL;
ALTER TABLE "MakeupTryOnSession" ALTER COLUMN "productId" TYPE UUID USING NULL;
