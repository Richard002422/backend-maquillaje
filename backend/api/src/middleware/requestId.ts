import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const REQUEST_ID_HEADER = 'x-request-id'

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header(REQUEST_ID_HEADER)
  const requestId = incoming?.trim() || randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}
