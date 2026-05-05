import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  AI_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
  INTERNAL_AI_TOKEN: z.string().min(16, 'INTERNAL_AI_TOKEN debe tener al menos 16 caracteres'),
  AI_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
  AI_HTTP_RETRIES: z.coerce.number().int().min(0).max(5).default(1),
  AI_HTTP_RETRY_BASE_MS: z.coerce.number().int().positive().default(200),
  API_JSON_LIMIT: z.string().default('1mb'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(180),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_HEAVY_MAX: z.coerce.number().int().positive().default(20),
  CORS_ORIGIN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}

export const env = loadEnv()
