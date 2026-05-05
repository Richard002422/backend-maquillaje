import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import multer from 'multer'
import { ZodError } from 'zod'
import { HttpError } from './httpError.js'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'FILE_TOO_LARGE',
        message: 'Imagen demasiado grande',
        requestId,
      })
    }
    return res.status(400).json({ code: 'UPLOAD_ERROR', message: err.message, requestId })
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Payload inválido',
      details: err.flatten(),
      requestId,
    })
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: 'Ya existe un registro con un valor único duplicado',
        requestId,
      })
    }
    return res.status(400).json({
      code: 'DB_REQUEST_ERROR',
      message: 'Error de persistencia',
      requestId,
    })
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      code: 'DB_VALIDATION_ERROR',
      message: 'Datos inválidos para operación de base de datos',
      requestId,
    })
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    })
  }
  console.error({ requestId, err })
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
    requestId,
  })
}
