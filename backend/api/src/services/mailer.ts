/**
 * Envío de emails transaccionales (reset de contraseña, verificación de
 * correo). Hoy es un STUB: loguea el link a consola en vez de mandar un
 * email real — no hay proveedor (SES/Resend/SendGrid) configurado todavía.
 *
 * El resto del código (routes/auth.ts) llama únicamente a las funciones de
 * abajo, nunca arma el mensaje ni conoce el transporte — cuando haya un
 * proveedor real, este es el ÚNICO archivo que cambia (reemplazar el cuerpo
 * de cada función por la llamada al SDK correspondiente), sin tocar rutas,
 * validación ni la lógica de tokens.
 */
import { env } from '../config.js'

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${env.APP_PUBLIC_URL}/reset-password?token=${token}`
  console.log(`[mailer:stub] Reset de contraseña para ${to} -> ${url}`)
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${env.APP_PUBLIC_URL}/verify-email?token=${token}`
  console.log(`[mailer:stub] Verificación de correo para ${to} -> ${url}`)
}
