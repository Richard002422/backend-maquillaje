import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import type { Env } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'
import { HttpError } from './middleware/httpError.js'
import { requestIdMiddleware } from './middleware/requestId.js'
import { preventPrototypePollution } from './middleware/security.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { productsRouter } from './routes/products.js'
import { realtimeRouter } from './routes/realtime.js'
import { recommendationsRouter } from './routes/recommendations.js'
import { tryOnRouter } from './routes/tryon.js'
import { usersRouter } from './routes/users.js'

export function createApp(env: Env) {
  const app = express()
  app.disable('x-powered-by')

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      referrerPolicy: { policy: 'no-referrer' },
    }),
  )
  app.use(express.json({ limit: env.API_JSON_LIMIT, strict: true }))
  app.use(requestIdMiddleware)
  app.use(preventPrototypePollution)

  const corsOrigins = env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean)
  app.use(
    cors({
      origin: corsOrigins?.length ? corsOrigins : true,
      credentials: true,
    }),
  )

  app.use(healthRouter())

  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })

  const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })

  const heavyLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_HEAVY_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })

  const v1 = express.Router()
  v1.use(globalLimiter)
  v1.use('/auth', authLimiter, authRouter(env))
  v1.use('/products', productsRouter())
  v1.use('/users', usersRouter(env))
  v1.use('/recommendations', recommendationsRouter(env))
  v1.use('/realtime', heavyLimiter, realtimeRouter(env))
  v1.use('/try-on', heavyLimiter, tryOnRouter(env))

  v1.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: 1 })
  })

  app.use('/v1', v1)
  app.use((_req, _res, next) => next(new HttpError(404, 'Ruta no encontrada', 'ROUTE_NOT_FOUND')))

  app.use(errorHandler)

  return app
}
