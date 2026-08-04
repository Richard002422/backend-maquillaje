import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Env } from '../config.js'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

let cachedClient: S3Client | null = null

export function isS3Configured(env: Env): boolean {
  return Boolean(env.AWS_S3_BUCKET && env.AWS_REGION)
}

export function getS3Client(env: Env): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({ region: env.AWS_REGION })
  }
  return cachedClient
}

export function productImagePublicUrl(env: Env, key: string): string {
  if (env.AWS_S3_PUBLIC_BASE_URL) {
    return `${env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`
  }
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`
}

export function buildProductImageKey(productId: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `products/${productId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
}

export async function uploadProductImage(
  env: Env,
  productId: string,
  file: Buffer,
  contentType: string,
  filename: string,
): Promise<{ key: string; url: string }> {
  if (!isS3Configured(env)) {
    throw new Error('S3 no configurado')
  }
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Tipo de imagen no permitido')
  }

  const key = buildProductImageKey(productId, filename)
  const client = getS3Client(env)

  await client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return { key, url: productImagePublicUrl(env, key) }
}
