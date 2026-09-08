import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const img = (seed: number) => `https://picsum.photos/seed/glow${seed}/800/1000`

const catalog = [
  {
    name: 'Sérum brillo 24h',
    category: 'Skincare',
    price: new Prisma.Decimal('32.00'),
    stock: 45,
    description: 'Serum ligero con ácido hialurónico para un glow natural que dura todo el día.',
    imageUrl: img(1),
  },
  {
    name: 'Base fluida HD',
    category: 'Rostro',
    price: new Prisma.Decimal('28.50'),
    stock: 30,
    description: 'Base de cobertura media-alta con acabado radiante y fórmula de larga duración.',
    imageUrl: img(2),
  },
  {
    name: 'Paleta atardecer',
    category: 'Ojos',
    price: new Prisma.Decimal('42.00'),
    stock: 18,
    description: 'Paleta de seis tonos rosados y dorados inspirada en el atardecer mediterráneo.',
    imageUrl: img(3),
  },
  {
    name: 'Labial velvet',
    category: 'Labios',
    price: new Prisma.Decimal('22.00'),
    stock: 60,
    description: 'Labial líquido mate de alta pigmentación con sensación ligera en los labios.',
    imageUrl: img(4),
  },
  {
    name: 'Iluminador polvo',
    category: 'Rostro',
    price: new Prisma.Decimal('35.00'),
    stock: 25,
    description: 'Polvo iluminador ultrafino para un brillo suave y modulable en pómulos.',
    imageUrl: img(5),
  },
  {
    name: 'Delineador punta pincel',
    category: 'Ojos',
    price: new Prisma.Decimal('18.90'),
    stock: 40,
    description: 'Delineador de punta flexible para trazos precisos y resistentes al agua.',
    imageUrl: img(6),
  },
  {
    name: 'Máscara volumen',
    category: 'Ojos',
    price: new Prisma.Decimal('24.00'),
    stock: 35,
    description: 'Máscara de pestañas con efecto lifting y volumen modulable.',
    imageUrl: img(7),
  },
  {
    name: 'Rubor en crema',
    category: 'Rostro',
    price: new Prisma.Decimal('26.00'),
    stock: 28,
    description: 'Rubor en crema difuminable con acabado fresco y natural.',
    imageUrl: img(8),
  },
  // Categoría "Pestañas": productos con probador virtual con IA (ver
  // LashOverlayAsset más abajo). Category separada de "Ojos" (paletas,
  // delineador) a propósito: son los únicos productos con overlay AR.
  {
    name: 'Pestañas Natural Lash',
    category: 'Pestañas',
    price: new Prisma.Decimal('14.90'),
    stock: 50,
    description: 'Pestañas postizas de efecto natural, ligeras para uso diario.',
    imageUrl: img(9),
  },
  {
    name: 'Pestañas Volumen Silk',
    category: 'Pestañas',
    price: new Prisma.Decimal('18.90'),
    stock: 40,
    description: 'Pestañas postizas de volumen medio con fibra de seda sintética.',
    imageUrl: img(10),
  },
  {
    name: 'Pestañas Drama Wing',
    category: 'Pestañas',
    price: new Prisma.Decimal('21.90'),
    stock: 25,
    description: 'Pestañas postizas dramáticas de efecto winged, para looks de noche.',
    imageUrl: img(11),
  },
] as const

// Metadatos del probador virtual (Fase 0-4). Coordenadas generadas junto con
// los PNG placeholder en frontend/public/lash-assets/ (ver
// scripts/gen_lash_assets.py referenciado en el chat) — si se reemplaza el
// PNG por fotografía real de producto, estas anclas deben regenerarse para
// el nuevo lienzo, no reusarse a ciegas.
const LASH_OVERLAY_BY_PRODUCT_NAME: Record<string, Omit<Prisma.LashOverlayAssetUncheckedCreateInput, 'productId'>> = {
  'Pestañas Natural Lash': {
    overlayUrl: '/lash-assets/natural.png',
    canvasWidth: 512,
    canvasHeight: 256,
    anchorInnerX: 0.1953,
    anchorInnerY: 0.5859,
    anchorOuterX: 0.8047,
    anchorOuterY: 0.5,
    eyeWidthRefPx: 312.77,
  },
  'Pestañas Volumen Silk': {
    overlayUrl: '/lash-assets/volumen.png',
    canvasWidth: 512,
    canvasHeight: 256,
    anchorInnerX: 0.1953,
    anchorInnerY: 0.5859,
    anchorOuterX: 0.8047,
    anchorOuterY: 0.5,
    eyeWidthRefPx: 312.77,
  },
  'Pestañas Drama Wing': {
    overlayUrl: '/lash-assets/dramatico.png',
    canvasWidth: 512,
    canvasHeight: 256,
    anchorInnerX: 0.1953,
    anchorInnerY: 0.5859,
    anchorOuterX: 0.8047,
    anchorOuterY: 0.5,
    eyeWidthRefPx: 312.77,
  },
}

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@glowlab.local' },
    create: {
      email: 'demo@glowlab.local',
      passwordHash: 'seed_password_hash_replace_in_real_env',
      firstName: 'Demo',
      lastName: 'User',
      skinTone: 'medium',
      skinType: 'mixta',
      preferredStyles: ['natural', 'glow'],
    },
    update: {
      firstName: 'Demo',
      lastName: 'User',
      skinTone: 'medium',
      skinType: 'mixta',
      preferredStyles: ['natural', 'glow'],
    },
  })

  await prisma.recommendationItem.deleteMany({ where: { recommendation: { source: 'seed' } } })
  await prisma.recommendation.deleteMany({ where: { source: 'seed' } })
  await prisma.tryOnAsset.deleteMany({
    where: { session: { note: 'Resultado generado por seed para pruebas de API' } },
  })
  await prisma.makeupTryOnSession.deleteMany({
    where: { note: 'Resultado generado por seed para pruebas de API' },
  })
  await prisma.product.deleteMany({})

  const created = []
  for (const item of catalog) {
    const product = await prisma.product.create({ data: { ...item } })
    created.push(product)
  }

  const byName = new Map(created.map((p) => [p.name, p]))

  for (const [productName, overlay] of Object.entries(LASH_OVERLAY_BY_PRODUCT_NAME)) {
    const product = byName.get(productName)
    if (!product) continue
    await prisma.lashOverlayAsset.upsert({
      where: { productId: product.id },
      create: { productId: product.id, ...overlay },
      update: overlay,
    })
  }

  const recommendation = await prisma.recommendation.create({
    data: {
      userId: demoUser.id,
      requestedLook: 'clean-girl',
      cartProductIds: [byName.get('Base fluida HD')!.id, byName.get('Rubor en crema')!.id],
      status: 'COMPLETED',
      source: 'seed',
      items: {
        create: [
          {
            productId: byName.get('Sérum brillo 24h')!.id,
            rank: 1,
            score: 0.94,
            reason: 'Aporta base luminosa al look',
          },
          {
            productId: byName.get('Rubor en crema')!.id,
            rank: 2,
            score: 0.88,
            reason: 'Acabado natural para uso diario',
          },
          {
            productId: byName.get('Iluminador polvo')!.id,
            rank: 3,
            score: 0.84,
            reason: 'Define puntos de luz',
          },
        ],
      },
    },
  })

  const tryOnSession = await prisma.makeupTryOnSession.create({
    data: {
      userId: demoUser.id,
      productId: byName.get('Labial velvet')!.id,
      lookId: 'soft-glam',
      sourceImageUrl: img(90),
      previewUrl: img(91),
      maskUrls: [img(92), img(93)],
      latencyMs: 842,
      note: 'Resultado generado por seed para pruebas de API',
      status: 'COMPLETED',
      assets: {
        create: [
          { kind: 'preview', url: img(91), metadata: { format: 'jpg' } },
          { kind: 'mask', url: img(92), metadata: { area: 'lips' } },
        ],
      },
    },
  })

  // DeviceToken/InteractionEvent son propios del demoUser: a diferencia de
  // Order (acotado por prefijo ORD-SEED-), acá alcanza con borrar todo lo
  // suyo y recrear — no hay riesgo de pisar datos reales de otro usuario.
  await prisma.deviceToken.deleteMany({ where: { userId: demoUser.id } })
  await prisma.deviceToken.create({
    data: { userId: demoUser.id, platform: 'ANDROID', token: 'seed-fcm-token-demo-android' },
  })

  await prisma.interactionEvent.deleteMany({ where: { userId: demoUser.id } })
  await prisma.interactionEvent.createMany({
    data: [
      { userId: demoUser.id, type: 'CATEGORY_VIEW', refId: 'ojos' },
      { userId: demoUser.id, type: 'PRODUCT_VIEW', refId: byName.get('Labial velvet')!.id },
      { userId: demoUser.id, type: 'PRODUCT_VIEW', refId: byName.get('Sérum brillo 24h')!.id },
      { userId: demoUser.id, type: 'SEARCH', searchTerm: 'base para piel mixta' },
    ],
  })

  // Pedidos demo para el panel admin (Lumina) — no hay checkout real todavía
  // (ver docs/README del backend), así que sin esto la sección de Orders
  // del panel se ve permanentemente vacía. A diferencia de products, acotado
  // a "ORD-SEED-*": si algún día existe un checkout real creando pedidos de
  // verdad, un restart de este contenedor no los borra.
  await prisma.order.deleteMany({ where: { orderNumber: { startsWith: 'ORD-SEED-' } } })

  const serum = byName.get('Sérum brillo 24h')!
  const labial = byName.get('Labial velvet')!
  const paleta = byName.get('Paleta atardecer')!

  await prisma.order.create({
    data: {
      orderNumber: 'ORD-SEED-000001',
      userId: demoUser.id,
      status: 'DELIVERED',
      subtotal: new Prisma.Decimal('54.00'),
      shipping: new Prisma.Decimal('4.50'),
      tax: new Prisma.Decimal('0'),
      discount: new Prisma.Decimal('0'),
      total: new Prisma.Decimal('58.50'),
      currency: 'EUR',
      shippingLine1: 'Calle Gran Vía 1',
      shippingCity: 'Madrid',
      shippingState: 'Madrid',
      shippingPostalCode: '28013',
      shippingCountry: 'España',
      items: {
        create: [
          {
            productId: serum.id,
            productName: serum.name,
            imageUrl: serum.imageUrl,
            quantity: 1,
            unitPrice: serum.price,
            total: serum.price,
          },
          {
            productId: labial.id,
            productName: labial.name,
            imageUrl: labial.imageUrl,
            quantity: 1,
            unitPrice: labial.price,
            total: labial.price,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'ORD-SEED-000002',
      userId: demoUser.id,
      status: 'PENDING',
      subtotal: paleta.price,
      shipping: new Prisma.Decimal('4.50'),
      tax: new Prisma.Decimal('0'),
      discount: new Prisma.Decimal('0'),
      total: paleta.price.add(new Prisma.Decimal('4.50')),
      currency: 'EUR',
      notes: 'Regalo - envolver por separado.',
      items: {
        create: [
          {
            productId: paleta.id,
            productName: paleta.name,
            imageUrl: paleta.imageUrl,
            quantity: 1,
            unitPrice: paleta.price,
            total: paleta.price,
          },
        ],
      },
    },
  })

  console.log(
    `Seeded ${created.length} products, recommendation ${recommendation.id}, try-on ${tryOnSession.id} and 2 demo orders`,
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
