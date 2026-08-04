import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const env = readFileSync('.env', 'utf8')
const match = env.match(/DATABASE_URL="([^"]+)"/)
if (!match) throw new Error('DATABASE_URL no encontrada en .env')

const targetUrl = match[1]
const adminUrl = targetUrl.replace(/\/[^/?]+(\?.*)?$/, '/postgres$1')

const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } })
const app = new PrismaClient({ datasources: { db: { url: targetUrl } } })

const dbName = targetUrl.replace(/^.*\/([^/?]+)(\?.*)?$/, '$1')

try {
  const existing = await admin.$queryRaw<{ datname: string }[]>`
    SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname
  `
  console.log('Bases de datos disponibles:')
  for (const row of existing) console.log(`- ${row.datname}`)

  if (!existing.some((r) => r.datname === dbName)) {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
    console.log(`\nBase "${dbName}" creada.`)
  }

  await app.$queryRaw`SELECT 1 AS ok`
  console.log(`\nConexión OK a "${dbName}".`)
} finally {
  await admin.$disconnect()
  await app.$disconnect()
}
