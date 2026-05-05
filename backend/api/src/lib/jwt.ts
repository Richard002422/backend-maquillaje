import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { Env } from '../config.js'

export type AccessPayload = { sub: string; email: string; typ: 'access' }

export function signAccessToken(
  env: Env,
  user: { id: string; email: string },
): { token: string; expiresInSec: number } {
  const expiresInSec = env.ACCESS_TOKEN_TTL_SEC
  const token = jwt.sign(
    { sub: user.id, email: user.email, typ: 'access' } satisfies AccessPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: expiresInSec, issuer: 'glowlab-api', audience: 'glowlab-clients' },
  )
  return { token, expiresInSec }
}

export function verifyAccessToken(env: Env, token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'glowlab-api',
    audience: 'glowlab-clients',
  }) as JwtPayload
  if (
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string' ||
    decoded.typ !== 'access'
  ) {
    throw new Error('Token inválido')
  }
  return { sub: decoded.sub, email: decoded.email, typ: 'access' }
}
