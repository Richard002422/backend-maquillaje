/**
 * Inserta (o actualiza) SOLO los 3 productos de pestañas de prueba + su
 * overlay AR — a diferencia de `prisma/seed.ts`, este script NO borra nada
 * del catálogo existente (usa `upsert` por nombre, no `deleteMany`).
 *
 * Uso (desde una red con acceso a la base de DATABASE_URL en .env):
 *   cd backend/api
 *   npx prisma migrate dev --name add_lash_overlay_asset   # una vez, crea la tabla
 *   npx tsx prisma/seedLashProducts.ts                       # inserta/actualiza los 3 productos
 */
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const img = (seed: number) => `https://picsum.photos/seed/glow${seed}/800/1000`

const LASH_PRODUCTS = [
  {
    name: 'Pestañas Natural Lash',
    category: 'Pestañas',
    price: new Prisma.Decimal('14.90'),
    stock: 50,
    description: 'Pestañas postizas de efecto natural, ligeras para uso diario.',
    imageUrl: img(9),
    overlay: {
      overlayUrl: '/lash-assets/natural.png',
      canvasWidth: 512,
      canvasHeight: 256,
      anchorInnerX: 0.1953,
      anchorInnerY: 0.5859,
      anchorOuterX: 0.8047,
      anchorOuterY: 0.5,
      eyeWidthRefPx: 312.77,
    },
  },
  {
    name: 'Pestañas Volumen Silk',
    category: 'Pestañas',
    price: new Prisma.Decimal('18.90'),
    stock: 40,
    description: 'Pestañas postizas de volumen medio con fibra de seda sintética.',
    imageUrl: img(10),
    overlay: {
      overlayUrl: '/lash-assets/volumen.png',
      canvasWidth: 512,
      canvasHeight: 256,
      anchorInnerX: 0.1953,
      anchorInnerY: 0.5859,
      anchorOuterX: 0.8047,
      anchorOuterY: 0.5,
      eyeWidthRefPx: 312.77,
    },
  },
  {
    name: 'Pestañas Drama Wing',
    category: 'Pestañas',
    price: new Prisma.Decimal('21.90'),
    stock: 25,
    description: 'Pestañas postizas dramáticas de efecto winged, para looks de noche.',
    imageUrl: img(11),
    overlay: {
      overlayUrl: '/lash-assets/dramatico.png',
      canvasWidth: 512,
      canvasHeight: 256,
      anchorInnerX: 0.1953,
      anchorInnerY: 0.5859,
      anchorOuterX: 0.8047,
      anchorOuterY: 0.5,
      eyeWidthRefPx: 312.77,
    },
  },
] as const

async function main() {
  for (const { overlay, ...productData } of LASH_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: {
        // Product.name no es @unique en el schema — buscamos primero por
        // nombre+categoría para decidir crear vs actualizar, en vez de
        // depender de una constraint que no existe.
        id: (await prisma.product.findFirst({ where: { name: productData.name } }))?.id ?? '00000000-0000-0000-0000-000000000000',
      },
      create: productData,
      update: productData,
    })

    await prisma.lashOverlayAsset.upsert({
      where: { productId: product.id },
      create: { productId: product.id, ...overlay },
      update: overlay,
    })

    console.log(`OK: ${product.name} (${product.id})`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
