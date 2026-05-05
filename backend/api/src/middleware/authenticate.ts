import type { NextFunction, Request, Response } from 'express'
import type { Env } from '../config.js'
import { verifyAccessToken } from '../lib/jwt.js'
import { HttpError } from './httpError.js'

export function requireAuth(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return next(new HttpError(401, 'Se requiere autenticación', 'UNAUTHORIZED'))
    }
    const token = header.slice('Bearer '.length).trim()
    try {
      const payload = verifyAccessToken(env, token)
      req.userId = payload.sub
      req.userEmail = payload.email
      next()
    } catch {
      next(new HttpError(401, 'Token de acceso inválido o expirado', 'INVALID_ACCESS_TOKEN'))
    }
  }
}

export function optionalAuth(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return next()
    const token = header.slice('Bearer '.length).trim()
    try {
      const payload = verifyAccessToken(env, token)
      req.userId = payload.sub
      req.userEmail = payload.email
    } catch {
      /* token opcional inválido: continuar como anónimo */
    }
    next()
  }
}
