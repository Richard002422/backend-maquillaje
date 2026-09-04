import { Router } from 'express'
import type { Env } from '../config.js'
import { prisma } from '../lib/prisma.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { orderInclude, serializeOrder } from './adminOrders.js'

/// Espejo de LOW_STOCK_THRESHOLD en src/lib/domain/inventory.ts (panel
/// admin Lumina) — ese valor es la fuente de verdad de la regla de
/// negocio; si cambia ahí, cambiarlo acá también (no hay forma de
/// compartir una constante TS entre los dos repos hoy).
const LOW_STOCK_THRESHOLD = 15
const TOP_PRODUCTS_LIMIT = 5
const REVENUE_SERIES_DAYS = 7
const NON_REVENUE_STATUSES = ['CANCELLED', 'REFUNDED'] as const

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function dateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10)
}

export function adminDashboardRouter(env: Env) {
  const r = Router()
  r.use(requireAdmin(env))

  r.get('/', async (_req, res, next) => {
    try {
      const now = new Date()
      const today = startOfDay(now)
      const monthStart = startOfMonth(now)
      const seriesStart = new Date(today)
      seriesStart.setUTCDate(seriesStart.getUTCDate() - (REVENUE_SERIES_DAYS - 1))

      const [
        revenueTodayAgg,
        revenueMonthAgg,
        ordersToday,
        ordersMonth,
        customersTotal,
        productsActive,
        lowStockCount,
        pendingOrders,
        aiAnalysesToday,
        aiRecommendationsToday,
        rangeOrders,
        recentOrderRows,
        allItems,
      ] = await Promise.all([
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: today }, status: { notIn: [...NON_REVENUE_STATUSES] } },
        }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: monthStart }, status: { notIn: [...NON_REVENUE_STATUSES] } },
        }),
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
        prisma.user.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        // "Análisis de IA" no tiene todavía un modelo propio (no hay
        // facial-analysis en este backend) — se aproxima con sesiones de
        // try-on, lo más parecido a "la IA analizó algo del usuario hoy".
        // Revisar cuando exista un módulo de análisis facial real.
        prisma.makeupTryOnSession.count({ where: { createdAt: { gte: today } } }),
        prisma.recommendation.count({ where: { createdAt: { gte: today } } }),
        prisma.order.findMany({
          where: { createdAt: { gte: seriesStart } },
          select: { createdAt: true, total: true, status: true },
        }),
        prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: orderInclude }),
        prisma.orderItem.findMany({
          select: { productId: true, productName: true, quantity: true, total: true },
        }),
      ])

      const buckets = new Map<string, { revenue: number; orders: number }>()
      for (let i = 0; i < REVENUE_SERIES_DAYS; i++) {
        const d = new Date(seriesStart)
        d.setUTCDate(d.getUTCDate() + i)
        buckets.set(dateKey(d), { revenue: 0, orders: 0 })
      }
      for (const order of rangeOrders) {
        const bucket = buckets.get(dateKey(order.createdAt))
        if (!bucket) continue
        bucket.orders += 1
        if (!NON_REVENUE_STATUSES.includes(order.status as (typeof NON_REVENUE_STATUSES)[number])) {
          bucket.revenue += Number(order.total)
        }
      }
      const revenueSeries = Array.from(buckets.entries()).map(([date, v]) => ({
        date,
        revenue: v.revenue,
        orders: v.orders,
      }))

      // Agregado en JS (no groupBy de Prisma): necesitamos el `productName`
      // snapshot junto con la suma, y groupBy no devuelve columnas no
      // agregadas. El volumen de OrderItem es chico (panel admin, no el
      // tráfico de la tienda), así que traer todo y sumar acá es simple y
      // suficientemente rápido.
      const topByProduct = new Map<string, { id: string | null; name: string; sold: number; revenue: number }>()
      for (const item of allItems) {
        const key = item.productId ?? `deleted:${item.productName}`
        const existing = topByProduct.get(key) ?? {
          id: item.productId,
          name: item.productName,
          sold: 0,
          revenue: 0,
        }
        existing.sold += item.quantity
        existing.revenue += Number(item.total)
        topByProduct.set(key, existing)
      }
      const topProducts = Array.from(topByProduct.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, TOP_PRODUCTS_LIMIT)
        .map((p) => ({ id: p.id ?? '', name: p.name, sold: p.sold, revenue: p.revenue }))

      return res.json({
        revenueToday: Number(revenueTodayAgg._sum?.total ?? 0),
        revenueMonth: Number(revenueMonthAgg._sum?.total ?? 0),
        ordersToday,
        ordersMonth,
        customersTotal,
        productsActive,
        lowStockCount,
        pendingOrders,
        aiAnalysesToday,
        aiRecommendationsToday,
        revenueSeries,
        topProducts,
        recentOrders: recentOrderRows.map(serializeOrder),
      })
    } catch (e) {
      next(e)
    }
  })

  return r
}
