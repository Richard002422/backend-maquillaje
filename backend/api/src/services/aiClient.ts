import type { Env } from '../config.js'

export type AiRecommendationRequest = {
  user_id?: string | null
  look?: string | null
  cart_product_ids: string[]
  limit?: number
}

export type AiRecommendationResponse = { product_ids: string[] }

export type AiTryOnResponse = {
  preview_url: string
  mask_urls: Record<string, string>
  latency_ms: number
  note?: string
}

export type AiRealtimeFrameRequest = {
  frame_base64: string
  look_id: string
}

export type AiRealtimeFrameResponse = {
  frame_base64: string
  latency_ms: number
  fps_hint: number
}

type AiCallOptions = {
  requestId?: string
}

export async function callAiRecommendations(
  env: Env,
  body: AiRecommendationRequest,
  options?: AiCallOptions,
): Promise<AiRecommendationResponse> {
  const url = new URL('/internal/v1/recommendations', env.AI_SERVICE_URL).toString()
  const res = await fetchWithRetry(env, url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': env.INTERNAL_AI_TOKEN,
      ...(options?.requestId ? { 'X-Request-Id': options.requestId } : {}),
    },
    body: JSON.stringify({
      user_id: body.user_id ?? null,
      look: body.look ?? null,
      cart_product_ids: body.cart_product_ids,
      limit: body.limit ?? 8,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI recommendations HTTP ${res.status}: ${text}`)
  }
  return (await res.json()) as AiRecommendationResponse
}

export async function callAiTryOn(
  env: Env,
  params: { lookId: string; image: Buffer; filename: string; userId: string },
  options?: AiCallOptions,
): Promise<AiTryOnResponse> {
  const url = new URL('/internal/v1/try-on', env.AI_SERVICE_URL).toString()
  const form = new FormData()
  form.append('look_id', params.lookId)
  form.append('user_id', params.userId)
  const imageBytes = Uint8Array.from(params.image)
  form.append(
    'image',
    new Blob([imageBytes], { type: 'application/octet-stream' }),
    params.filename || 'upload.jpg',
  )
  const res = await fetchWithRetry(env, url, {
    method: 'POST',
    headers: {
      'X-Internal-Token': env.INTERNAL_AI_TOKEN,
      ...(options?.requestId ? { 'X-Request-Id': options.requestId } : {}),
    },
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI try-on HTTP ${res.status}: ${text}`)
  }
  return (await res.json()) as AiTryOnResponse
}

export async function callAiRealtimeFrame(
  env: Env,
  body: AiRealtimeFrameRequest,
  options?: AiCallOptions,
): Promise<AiRealtimeFrameResponse> {
  const url = new URL('/internal/v1/realtime/process-frame', env.AI_SERVICE_URL).toString()
  const res = await fetchWithRetry(env, url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': env.INTERNAL_AI_TOKEN,
      ...(options?.requestId ? { 'X-Request-Id': options.requestId } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI realtime HTTP ${res.status}: ${text}`)
  }
  return (await res.json()) as AiRealtimeFrameResponse
}

async function fetchWithRetry(env: Env, url: string, init: RequestInit): Promise<Response> {
  let attempt = 0
  let lastError: unknown = null
  const maxAttempts = env.AI_HTTP_RETRIES + 1

  while (attempt < maxAttempts) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), env.AI_HTTP_TIMEOUT_MS)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timeout)
      if (res.status >= 500 && attempt < maxAttempts - 1) {
        await sleep(backoffMs(env, attempt))
        attempt += 1
        continue
      }
      return res
    } catch (err) {
      clearTimeout(timeout)
      lastError = err
      if (attempt >= maxAttempts - 1) {
        break
      }
      await sleep(backoffMs(env, attempt))
      attempt += 1
    }
  }

  throw new Error(`AI service unavailable after ${maxAttempts} attempts: ${String(lastError)}`)
}

function backoffMs(env: Env, attempt: number): number {
  const jitter = Math.floor(Math.random() * 75)
  return env.AI_HTTP_RETRY_BASE_MS * 2 ** attempt + jitter
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
