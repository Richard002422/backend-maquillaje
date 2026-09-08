/**
 * Inserta (o actualiza) la jerarquía Clase → Categoría del menú de
 * navegación ("Ojos" → "Sombra de ojos", "Primer"...). Usa `upsert` por id
 * fijo — NO borra nada del catálogo existente (igual criterio que
 * `seedLashCollection.ts`).
 *
 * Necesario además de la migración `20260905120000_product_class_category_taxonomy`
 * porque `prisma db push` (el flujo de desarrollo local, ver CLAUDE.md) NO
 * ejecuta migraciones — solo sincroniza el esquema. Quien use `db push` en
 * vez de `migrate deploy` necesita correr este script para tener datos.
 *
 * Uso:
 *   cd backend/api
 *   npx prisma db push               # o: npx prisma migrate deploy
 *   npx tsx prisma/seedCatalogTaxonomy.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type SeedCategory = { id: string; name: string; slug: string; displayOrder: number }
type SeedClass = {
  id: string
  name: string
  slug: string
  icon: string
  displayOrder: number
  categories: SeedCategory[]
}

// Debe reflejar exactamente el contenido de la migración SQL homónima — si
// se agrega una clase/categoría nueva, agregarla en ambos lugares (o, mejor,
// dejar de tocar la migración a mano y hacerlo solo por acá + panel admin).
const TAXONOMY: SeedClass[] = [
  {
    id: 'class_ojos',
    name: 'Ojos',
    slug: 'ojos',
    icon: '👁️',
    displayOrder: 10,
    categories: [
      { id: 'cat_ojos_sombra', name: 'Sombra de ojos', slug: 'sombra-de-ojos', displayOrder: 10 },
      { id: 'cat_ojos_base', name: 'Base', slug: 'base', displayOrder: 20 },
      { id: 'cat_ojos_primer', name: 'Primer', slug: 'primer', displayOrder: 30 },
      { id: 'cat_ojos_cejas', name: 'Cejas', slug: 'cejas', displayOrder: 40 },
      { id: 'cat_ojos_delineador', name: 'Delineador de ojos', slug: 'delineador-de-ojos', displayOrder: 50 },
      { id: 'cat_ojos_mascara', name: 'Máscara de pestañas', slug: 'mascara-de-pestanas', displayOrder: 60 },
      { id: 'cat_ojos_pestanas', name: 'Pestañas', slug: 'pestanas', displayOrder: 70 },
      { id: 'cat_ojos_set', name: 'Set de ojos', slug: 'set-de-ojos', displayOrder: 80 },
    ],
  },
  {
    id: 'class_rostro',
    name: 'Rostro',
    slug: 'rostro',
    icon: '✨',
    displayOrder: 20,
    categories: [
      { id: 'cat_rostro_base', name: 'Base de maquillaje', slug: 'base-de-maquillaje', displayOrder: 10 },
      { id: 'cat_rostro_corrector', name: 'Corrector', slug: 'corrector', displayOrder: 20 },
      { id: 'cat_rostro_polvo', name: 'Polvo y fijador', slug: 'polvo-y-fijador', displayOrder: 30 },
      { id: 'cat_rostro_rubor', name: 'Rubor', slug: 'rubor', displayOrder: 40 },
      { id: 'cat_rostro_iluminador', name: 'Iluminador', slug: 'iluminador', displayOrder: 50 },
      { id: 'cat_rostro_contorno', name: 'Contorno', slug: 'contorno', displayOrder: 60 },
      { id: 'cat_rostro_primer', name: 'Primer de rostro', slug: 'primer-de-rostro', displayOrder: 70 },
    ],
  },
  {
    id: 'class_labios',
    name: 'Labios',
    slug: 'labios',
    icon: '💋',
    displayOrder: 30,
    categories: [
      { id: 'cat_labios_labial', name: 'Labiales', slug: 'labiales', displayOrder: 10 },
      { id: 'cat_labios_gloss', name: 'Gloss', slug: 'gloss', displayOrder: 20 },
      { id: 'cat_labios_delineador', name: 'Delineador de labios', slug: 'delineador-de-labios', displayOrder: 30 },
      { id: 'cat_labios_balsamo', name: 'Bálsamo labial', slug: 'balsamo-labial', displayOrder: 40 },
      { id: 'cat_labios_set', name: 'Set de labios', slug: 'set-de-labios', displayOrder: 50 },
    ],
  },
  {
    id: 'class_skincare',
    name: 'Skincare',
    slug: 'skincare',
    icon: '🧴',
    displayOrder: 40,
    categories: [
      { id: 'cat_skincare_limpiadores', name: 'Limpiadores', slug: 'limpiadores', displayOrder: 10 },
      { id: 'cat_skincare_serums', name: 'Sérums', slug: 'serums', displayOrder: 20 },
      { id: 'cat_skincare_hidratantes', name: 'Hidratantes', slug: 'hidratantes', displayOrder: 30 },
      { id: 'cat_skincare_spf', name: 'Protector solar', slug: 'protector-solar', displayOrder: 40 },
      { id: 'cat_skincare_mascarillas', name: 'Mascarillas', slug: 'mascarillas', displayOrder: 50 },
    ],
  },
  {
    id: 'class_tintes',
    name: 'Tintes',
    slug: 'tintes',
    icon: '🎨',
    displayOrder: 50,
    categories: [
      { id: 'cat_tintes_permanentes', name: 'Tintes permanentes', slug: 'tintes-permanentes', displayOrder: 10 },
      {
        id: 'cat_tintes_semipermanentes',
        name: 'Tintes semipermanentes',
        slug: 'tintes-semipermanentes',
        displayOrder: 20,
      },
      { id: 'cat_tintes_fantasia', name: 'Tonos fantasía', slug: 'tonos-fantasia', displayOrder: 30 },
      { id: 'cat_tintes_kits', name: 'Kits de coloración', slug: 'kits-de-coloracion', displayOrder: 40 },
    ],
  },
]

async function main() {
  let classCount = 0
  let categoryCount = 0

  for (const cls of TAXONOMY) {
    await prisma.productClass.upsert({
      where: { id: cls.id },
      update: { name: cls.name, slug: cls.slug, icon: cls.icon, displayOrder: cls.displayOrder },
      create: {
        id: cls.id,
        name: cls.name,
        slug: cls.slug,
        icon: cls.icon,
        displayOrder: cls.displayOrder,
      },
    })
    classCount += 1

    for (const cat of cls.categories) {
      await prisma.productCategory.upsert({
        where: { id: cat.id },
        update: { name: cat.name, slug: cat.slug, displayOrder: cat.displayOrder, classId: cls.id },
        create: {
          id: cat.id,
          classId: cls.id,
          name: cat.name,
          slug: cat.slug,
          displayOrder: cat.displayOrder,
        },
      })
      categoryCount += 1
    }
    console.log(`OK clase "${cls.name}" (${cls.categories.length} categorías)`)
  }

  console.log(`\nListo: ${classCount} clases, ${categoryCount} categorías.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
