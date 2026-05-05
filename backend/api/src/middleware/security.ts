import type { NextFunction, Request, Response } from 'express'
import { HttpError } from './httpError.js'

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function preventPrototypePollution(req: Request, _res: Response, next: NextFunction) {
  try {
    scanValue(req.body)
    scanValue(req.query)
    scanValue(req.params)
    next()
  } catch (err) {
    next(err)
  }
}

function scanValue(value: unknown): void {
  if (value == null) return
  if (Array.isArray(value)) {
    for (const item of value) scanValue(item)
    return
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    for (const key of Object.keys(obj)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new HttpError(400, 'Payload bloqueado por seguridad', 'UNSAFE_PAYLOAD_KEY', { key })
      }
      scanValue(obj[key])
    }
  }
}
