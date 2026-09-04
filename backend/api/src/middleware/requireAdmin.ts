import type { Request, Response, NextFunction } from 'express'
import type { Env } from '../config.js'
import { HttpError } from './httpError.js'

/// Compartido por todas las rutas /v1/admin/* (products, orders, customers):
/// token estático server-to-server (Django lo llama con esto, nunca un
/// navegador). Extraído de adminProducts.ts para no repetirlo en cada
/// router nuevo.
export function requireAdmin(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = req.header('X-Admin-Token') ?? req.header('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!env.ADMIN_API_TOKEN || token !== env.ADMIN_API_TOKEN) {
      next(new HttpError(401, 'Token de administrador inválido', 'UNAUTHORIZED'))
      return
    }
    next()
  }
}
