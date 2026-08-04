import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

await prisma.recommendationItem.deleteMany()
await prisma.tryOnAsset.deleteMany()
await prisma.makeupTryOnSession.deleteMany()
await prisma.product.deleteMany()
await prisma.$disconnect()
console.log('Product-related rows cleared')
