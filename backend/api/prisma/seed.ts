import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const _img = (seed: number) => `https://picsum.photos/seed/glow${seed}/800/1000`

const products = [
  {
    id: 'serum-brillo',
    name: 'Sérum brillo 24h',
    category: 'Skincare',
    priceEur: 32,
    tags: ['luminosidad', 'hidratación', 'vegano'],
    imageUrls: [_img(1), _img(11), _img(21)],
    stockHint: 'Quedan pocas unidades',
    discountPercent: 15,
    aiPitch:
      'Encaja con pieles que buscan glow natural y refuerza el look «Clean girl» que sueles explorar.',
  },
  {
    id: 'base-hd',
    name: 'Base fluida HD',
    category: 'Rostro',
    priceEur: 28.5,
    tags: ['cobertura media', 'larga duración'],
    imageUrls: [_img(2), _img(12)],
    discountPercent: 20,
    aiPitch: 'Equilibra tu tono cálido y combina con rubores melocotón del catálogo.',
  },
  {
    id: 'paleta-atardecer',
    name: 'Paleta atardecer',
    category: 'Ojos',
    priceEur: 42,
    tags: ['sombras', 'fiesta', 'pigmento'],
    imageUrls: [_img(3), _img(13), _img(23), _img(33)],
    stockHint: 'Top ventas esta semana',
    aiPitch: 'Ideal si quieres profundidad en párpados; armoniza con labiales terracota.',
  },
  {
    id: 'labial-velvet',
    name: 'Labial velvet',
    category: 'Labios',
    priceEur: 22,
    tags: ['mate', 'cómodo'],
    imageUrls: [_img(4), _img(14)],
    aiPitch: 'Contraste elegante con looks suaves en ojos; favorece conversión en bundle.',
  },
  {
    id: 'iluminador',
    name: 'Iluminador polvo',
    category: 'Rostro',
    priceEur: 35,
    tags: ['brillo', 'editorial'],
    imageUrls: [_img(5), _img(15), _img(25)],
    aiPitch: 'Potencia el AR en vivo al captar reflejos reales sobre pómulos.',
  },
  {
    id: 'delineador',
    name: 'Delineador punta pincel',
    category: 'Ojos',
    priceEur: 18.9,
    tags: ['precisión', 'waterproof'],
    imageUrls: [_img(6), _img(16)],
    aiPitch: null,
  },
  {
    id: 'mascara',
    name: 'Máscara volumen',
    category: 'Ojos',
    priceEur: 24,
    tags: ['pestañas', 'lifting'],
    imageUrls: [_img(7), _img(17)],
    discountPercent: 10,
    aiPitch: null,
  },
  {
    id: 'rubor-crema',
    name: 'Rubor en crema',
    category: 'Rostro',
    priceEur: 26,
    tags: ['fresco', 'difuminable'],
    imageUrls: [_img(8), _img(18), _img(28)],
    aiPitch:
      'Refuerza prueba social: look natural que se ve bien en cámara frontal.',
  },
]

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

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        sku: `SKU-${p.id.toUpperCase()}`,
        name: p.name,
        description: `Producto ${p.name} para looks de maquillaje asistidos por IA.`,
        brand: 'GlowLab',
        category: p.category,
        priceEur: p.priceEur,
        tags: p.tags,
        imageUrls: p.imageUrls,
        stockHint: p.stockHint ?? null,
        discountPercent: p.discountPercent ?? null,
        aiPitch: p.aiPitch ?? null,
      },
      update: {
        sku: `SKU-${p.id.toUpperCase()}`,
        name: p.name,
        description: `Producto ${p.name} para looks de maquillaje asistidos por IA.`,
        brand: 'GlowLab',
        category: p.category,
        priceEur: p.priceEur,
        tags: p.tags,
        imageUrls: p.imageUrls,
        stockHint: p.stockHint ?? null,
        discountPercent: p.discountPercent ?? null,
        aiPitch: p.aiPitch ?? null,
      },
    })
  }

  await prisma.recommendationItem.deleteMany({
    where: { recommendation: { userId: demoUser.id, source: 'seed' } },
  })
  await prisma.recommendation.deleteMany({
    where: { userId: demoUser.id, source: 'seed' },
  })
  await prisma.tryOnAsset.deleteMany({
    where: { session: { userId: demoUser.id, note: 'Resultado generado por seed para pruebas de API' } },
  })
  await prisma.makeupTryOnSession.deleteMany({
    where: { userId: demoUser.id, note: 'Resultado generado por seed para pruebas de API' },
  })

  const recommendation = await prisma.recommendation.create({
    data: {
      userId: demoUser.id,
      requestedLook: 'clean-girl',
      cartProductIds: ['base-hd', 'rubor-crema'],
      status: 'COMPLETED',
      source: 'seed',
      items: {
        create: [
          { productId: 'serum-brillo', rank: 1, score: 0.94, reason: 'Aporta base luminosa al look' },
          { productId: 'rubor-crema', rank: 2, score: 0.88, reason: 'Acabado natural para uso diario' },
          { productId: 'iluminador', rank: 3, score: 0.84, reason: 'Define puntos de luz' },
        ],
      },
    },
  })

  const tryOnSession = await prisma.makeupTryOnSession.create({
    data: {
      userId: demoUser.id,
      productId: 'labial-velvet',
      lookId: 'soft-glam',
      sourceImageUrl: _img(90),
      previewUrl: _img(91),
      maskUrls: [_img(92), _img(93)],
      latencyMs: 842,
      note: 'Resultado generado por seed para pruebas de API',
      status: 'COMPLETED',
      assets: {
        create: [
          { kind: 'preview', url: _img(91), metadata: { format: 'jpg' } },
          { kind: 'mask', url: _img(92), metadata: { area: 'lips' } },
        ],
      },
    },
  })
  console.log(
    `Seeded ${products.length} products, recommendation ${recommendation.id} and try-on session ${tryOnSession.id}`,
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
