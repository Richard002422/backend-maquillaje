import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export function healthRouter() {
  const r = Router()

  r.get('/health', async (_req, res) => {
    res.json({ status: 'ok', service: 'glowlab-api' })
  })

  r.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return res.json({ status: 'ready', database: true })
    } catch {
      return res.status(503).json({ status: 'not_ready', database: false })
    }
  })

  return r
}
