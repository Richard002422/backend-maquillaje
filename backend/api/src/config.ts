import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  // Corta a propósito: un PasswordResetToken vigente equivale a tomar control
  // total de la cuenta sin conocer la contraseña actual (ver schema.prisma).
  PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(60),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(48),
  // Base para armar el link que viaja en el email (reset-password?token=...,
  // verify-email?token=...). Sin dominio propio todavía (mailer.ts es un
  // stub que solo loguea) — placeholder explícito en vez de un localhost
  // que alguien podría confundir con un valor real ya configurado.
  APP_PUBLIC_URL: z.string().url().default('https://app.lumina.beauty'),
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
  ADMIN_API_TOKEN: z.string().min(16).optional(),
  // Fase 8 (panel admin Lumina, notificaciones push): JSON completo de la
  // service account de Firebase (client_email/private_key/project_id),
  // como string de una sola línea. Opcional a propósito — sin esto,
  // sendPushMessage() degrada devolviendo un resultado "no configurado"
  // por cada destinatario en vez de tirar el server abajo (ver
  // services/pushProvider.ts). Nunca en el repo: solo en el .env real.
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
  AWS_REGION: z.string().default('us-east-2'),
  AWS_S3_BUCKET: z.string().min(3).optional(),
  AWS_S3_PUBLIC_BASE_URL: z.string().url().optional(),
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
