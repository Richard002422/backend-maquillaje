/// Envío de push vía FCM HTTP v1 (panel admin Lumina, Fase 8) — a propósito
/// SIN el SDK `firebase-admin`: agregar una dependencia nueva implica
/// correr `npm install` (regenera package-lock.json, y este repo ya tiene
/// mucho WIP ajeno sin commitear en ese archivo — ver nota de "commits
/// quirúrgicos" en la memoria de arquitectura) y potencialmente un
/// `npm ci` de ~10 min en el build de Docker. El protocolo es simple:
/// intercambiar un JWT firmado con la private key de la service account
/// por un access token de Google (RS256, ya lo hace `jsonwebtoken`, ya
/// dependencia del proyecto), y pegarle a la REST API de FCM directo con
/// `fetch` global (Node 20+, ver package.json engines).
import jwt from 'jsonwebtoken'
import { env } from '../config.js'

interface FcmServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

// Cacheados a nivel módulo: el token de acceso dura 1h (ver expiresAt) y la
// service account no cambia en caliente — parsear el JSON en cada envío
// sería trabajo repetido sin ningún beneficio.
let cachedAccount: FcmServiceAccount | null | undefined
let cachedToken: { value: string; expiresAt: number } | null = null

function loadServiceAccount(): FcmServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount
  if (!env.FCM_SERVICE_ACCOUNT_JSON) {
    cachedAccount = null
    return null
  }
  try {
    cachedAccount = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON) as FcmServiceAccount
  } catch {
    console.error('FCM_SERVICE_ACCOUNT_JSON no es JSON válido — push deshabilitado')
    cachedAccount = null
  }
  return cachedAccount
}

async function getAccessToken(account: FcmServiceAccount): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000)
  // 30s de margen: evita usar un token que expira a mitad del request.
  if (cachedToken && cachedToken.expiresAt > nowSec + 30) return cachedToken.value

  const assertion = jwt.sign(
    {
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    },
    account.private_key,
    { algorithm: 'RS256' },
  )

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!response.ok) {
    throw new Error(`No se pudo obtener el access token de FCM (HTTP ${response.status})`)
  }
  const body = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: body.access_token, expiresAt: nowSec + body.expires_in }
  return body.access_token
}

export interface PushMessage {
  token: string
  title: string
  body: string
  imageUrl?: string | null
  /// FCM exige que `data` sea un mapa string -> string (a diferencia de
  /// `notification`, que sí acepta estructura) — el caller es responsable
  /// de serializar cualquier valor no-string antes de llegar acá.
  data?: Record<string, string>
}

export type PushSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; unregistered: boolean }

export const isPushConfigured = (): boolean => loadServiceAccount() !== null

export async function sendPushMessage(message: PushMessage): Promise<PushSendResult> {
  const account = loadServiceAccount()
  if (!account) {
    return { ok: false, error: 'FCM no está configurado (falta FCM_SERVICE_ACCOUNT_JSON)', unregistered: false }
  }

  let accessToken: string
  try {
    accessToken = await getAccessToken(account)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fallo al autenticar con FCM', unregistered: false }
  }

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: message.token,
          notification: {
            title: message.title,
            body: message.body,
            ...(message.imageUrl ? { image: message.imageUrl } : {}),
          },
          ...(message.data ? { data: message.data } : {}),
        },
      }),
    },
  )

  if (response.ok) {
    const body = (await response.json()) as { name: string }
    return { ok: true, messageId: body.name }
  }

  const errorBody = (await response.json().catch(() => null)) as
    | { error?: { status?: string; message?: string } }
    | null
  const status = errorBody?.error?.status
  // UNREGISTERED/NOT_FOUND: el token ya no es válido (app desinstalada,
  // token rotado en el dispositivo) — el caller lo desactiva en
  // DeviceToken en vez de seguir reintentando en cada campaña futura.
  const unregistered = status === 'UNREGISTERED' || status === 'NOT_FOUND'
  return {
    ok: false,
    error: errorBody?.error?.message ?? `FCM respondió HTTP ${response.status}`,
    unregistered,
  }
}
