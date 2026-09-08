-- Jerarquía Clase → Categoría para el menú deslizable de navegación
-- ("Ojos" → "Sombra de ojos", "Primer", ...). Ver ADR en
-- backend/api/ARCHITECTURE.md y docs/05-contratos-api-rest.md.

CREATE TABLE "product_classes" (
  "id"            TEXT PRIMARY KEY,
  "name"          VARCHAR(80) NOT NULL,
  "slug"          VARCHAR(100) NOT NULL,
  "icon"          VARCHAR(8),
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "product_classes_slug_key" ON "product_classes"("slug");
CREATE INDEX "product_classes_display_order_idx" ON "product_classes"("display_order");

CREATE TABLE "product_categories" (
  "id"            TEXT PRIMARY KEY,
  "class_id"      TEXT NOT NULL REFERENCES "product_classes"("id") ON DELETE CASCADE,
  "name"          VARCHAR(80) NOT NULL,
  "slug"          VARCHAR(100) NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "product_categories_class_id_slug_key" ON "product_categories"("class_id", "slug");
CREATE INDEX "product_categories_class_id_display_order_idx" ON "product_categories"("class_id", "display_order");

ALTER TABLE "products"
  ADD COLUMN "catalog_category_id" TEXT REFERENCES "product_categories"("id") ON DELETE SET NULL;
CREATE INDEX "products_catalog_category_id_idx" ON "products"("catalog_category_id");

COMMENT ON COLUMN "products"."category" IS 'LEGADO: string libre, solo lectura. Usar catalog_category_id para productos nuevos.';
COMMENT ON COLUMN "products"."catalog_category_id" IS 'FK a product_categories. Nullable mientras se completa el backfill de productos legados.';

-- Taxonomía base (5 clases × sus categorías). IDs legibles y estables a
-- propósito (no cuid aleatorio) para que el backfill de abajo y futuros
-- scripts puedan referenciarlos sin volver a consultarlos. ON CONFLICT DO
-- NOTHING hace esta sección idempotente si la migración se re-ejecuta.
INSERT INTO "product_classes" ("id", "name", "slug", "icon", "display_order", "updated_at") VALUES
  ('class_ojos',     'Ojos',     'ojos',     '👁️', 10, CURRENT_TIMESTAMP),
  ('class_rostro',   'Rostro',   'rostro',   '✨', 20, CURRENT_TIMESTAMP),
  ('class_labios',   'Labios',   'labios',   '💋', 30, CURRENT_TIMESTAMP),
  ('class_skincare', 'Skincare', 'skincare', '🧴', 40, CURRENT_TIMESTAMP),
  ('class_tintes',   'Tintes',   'tintes',   '🎨', 50, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- "Más vendidos" NO se inserta aquí: es una categoría sintética que la API
-- calcula al vuelo (ver GET /v1/classes/:slug/categories), no una fila real.
INSERT INTO "product_categories" ("id", "class_id", "name", "slug", "display_order", "updated_at") VALUES
  ('cat_ojos_sombra',      'class_ojos', 'Sombra de ojos',      'sombra-de-ojos',      10, CURRENT_TIMESTAMP),
  ('cat_ojos_base',        'class_ojos', 'Base',                'base',                20, CURRENT_TIMESTAMP),
  ('cat_ojos_primer',      'class_ojos', 'Primer',              'primer',              30, CURRENT_TIMESTAMP),
  ('cat_ojos_cejas',       'class_ojos', 'Cejas',               'cejas',               40, CURRENT_TIMESTAMP),
  ('cat_ojos_delineador',  'class_ojos', 'Delineador de ojos',  'delineador-de-ojos',  50, CURRENT_TIMESTAMP),
  ('cat_ojos_mascara',     'class_ojos', 'Máscara de pestañas', 'mascara-de-pestanas', 60, CURRENT_TIMESTAMP),
  ('cat_ojos_pestanas',    'class_ojos', 'Pestañas',            'pestanas',            70, CURRENT_TIMESTAMP),
  ('cat_ojos_set',         'class_ojos', 'Set de ojos',         'set-de-ojos',         80, CURRENT_TIMESTAMP),

  ('cat_rostro_base',      'class_rostro', 'Base de maquillaje', 'base-de-maquillaje', 10, CURRENT_TIMESTAMP),
  ('cat_rostro_corrector', 'class_rostro', 'Corrector',          'corrector',          20, CURRENT_TIMESTAMP),
  ('cat_rostro_polvo',     'class_rostro', 'Polvo y fijador',    'polvo-y-fijador',    30, CURRENT_TIMESTAMP),
  ('cat_rostro_rubor',     'class_rostro', 'Rubor',              'rubor',              40, CURRENT_TIMESTAMP),
  ('cat_rostro_iluminador','class_rostro', 'Iluminador',         'iluminador',         50, CURRENT_TIMESTAMP),
  ('cat_rostro_contorno',  'class_rostro', 'Contorno',           'contorno',           60, CURRENT_TIMESTAMP),
  ('cat_rostro_primer',    'class_rostro', 'Primer de rostro',   'primer-de-rostro',   70, CURRENT_TIMESTAMP),

  ('cat_labios_labial',     'class_labios', 'Labiales',              'labiales',              10, CURRENT_TIMESTAMP),
  ('cat_labios_gloss',      'class_labios', 'Gloss',                 'gloss',                 20, CURRENT_TIMESTAMP),
  ('cat_labios_delineador', 'class_labios', 'Delineador de labios',  'delineador-de-labios',  30, CURRENT_TIMESTAMP),
  ('cat_labios_balsamo',    'class_labios', 'Bálsamo labial',        'balsamo-labial',        40, CURRENT_TIMESTAMP),
  ('cat_labios_set',        'class_labios', 'Set de labios',         'set-de-labios',         50, CURRENT_TIMESTAMP),

  ('cat_skincare_limpiadores', 'class_skincare', 'Limpiadores',      'limpiadores',      10, CURRENT_TIMESTAMP),
  ('cat_skincare_serums',      'class_skincare', 'Sérums',           'serums',           20, CURRENT_TIMESTAMP),
  ('cat_skincare_hidratantes', 'class_skincare', 'Hidratantes',      'hidratantes',      30, CURRENT_TIMESTAMP),
  ('cat_skincare_spf',         'class_skincare', 'Protector solar',  'protector-solar',  40, CURRENT_TIMESTAMP),
  ('cat_skincare_mascarillas', 'class_skincare', 'Mascarillas',      'mascarillas',      50, CURRENT_TIMESTAMP),

  ('cat_tintes_permanentes',     'class_tintes', 'Tintes permanentes',      'tintes-permanentes',      10, CURRENT_TIMESTAMP),
  ('cat_tintes_semipermanentes', 'class_tintes', 'Tintes semipermanentes',  'tintes-semipermanentes',  20, CURRENT_TIMESTAMP),
  ('cat_tintes_fantasia',        'class_tintes', 'Tonos fantasía',         'tonos-fantasia',          30, CURRENT_TIMESTAMP),
  ('cat_tintes_kits',            'class_tintes', 'Kits de coloración',     'kits-de-coloracion',      40, CURRENT_TIMESTAMP)
ON CONFLICT ("class_id", "slug") DO NOTHING;

-- Backfill best-effort: los productos legados (category string plana) NO se
-- asignan a una subcategoría específica -- no hay información suficiente en
-- el dato legado para adivinar "Sombra de ojos" vs "Delineador" sin
-- inventarla. catalog_category_id queda NULL a propósito; el listado
-- público (GET /v1/products?classSlug=...) sigue encontrando estos
-- productos por clase gracias al mapeo LEGACY_CATEGORY_BY_CLASS_SLUG en
-- routes/products.ts, hasta que un admin les asigne categoría real desde
-- el panel (PATCH /v1/admin/products/:id { catalogCategoryId }).
