import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const env = readFileSync('.env', 'utf8')
const m = env.match(/DATABASE_URL=(?:"([^"]+)"|'([^']+)'|([^\s#]+))/)
if (!m) {
  console.log('NO_DATABASE_URL')
  process.exit(1)
}

const url = (m[1] || m[2] || m[3]).trim()
const dbName = url.replace(/^.*\/([^/?]+)(\?.*)?$/, '$1')
const host = url.replace(/^postgresql:\/\/[^@]+@([^/]+).*/, '$1')

console.log(`DATABASE_NAME=${dbName}`)
console.log(`HOST=${host}`)

const expected = [
  'User',
  'RefreshToken',
  'Recommendation',
  'RecommendationItem',
  'MakeupTryOnSession',
  'TryOnAsset',
  'customer_profiles',
  'products',
  '_prisma_migrations',
]

const prisma = new PrismaClient({ datasources: { db: { url } } })

try {
  const dbs = await prisma.$queryRaw`
    SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname
  `
  console.log(`DATABASES=${dbs.map((r) => r.datname).join(',')}`)

  const glowlabExists = dbs.some((r) => r.datname === 'glowlab')
  const glowLabExists = dbs.some((r) => r.datname === 'glow-lab')
  console.log(`HAS_glowlab=${glowlabExists}`)
  console.log(`HAS_glow-lab=${glowLabExists}`)

  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  const names = tables.map((r) => r.table_name)
  console.log(`TABLES=${names.join(',') || '(none)'}`)
  console.log(`TABLE_COUNT=${names.length}`)

  const missing = expected.filter((t) => !names.includes(t))
  const extra = names.filter((t) => !expected.includes(t))
  console.log(`EXPECTED_MISSING=${missing.length ? missing.join(',') : 'none'}`)
  console.log(`UNEXPECTED_EXTRA=${extra.length ? extra.join(',') : 'none'}`)

  for (const t of ['User', 'products', 'customer_profiles', 'Recommendation']) {
    if (names.includes(t)) {
      const quoted = `"${t}"`
      const c = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM ${quoted}`)
      console.log(`ROWS_${t}=${c[0].n}`)
    }
  }
} catch (e) {
  console.log(`ERROR=${e.message?.split('\n')[0] || String(e)}`)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
