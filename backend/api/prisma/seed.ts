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
] as const

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

  console.log(
    `Seeded ${created.length} products, recommendation ${recommendation.id} and try-on ${tryOnSession.id}`,
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
