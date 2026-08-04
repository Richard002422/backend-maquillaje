/**
 * Configura el bucket S3 de imágenes de productos (idempotente).
 *
 * Requisitos: AWS CLI configurado (`aws sts get-caller-identity`).
 *
 * Uso:
 *   npm run aws:setup-s3-bucket
 */
import { execSync } from 'node:child_process'

const REGION = process.env.AWS_REGION ?? 'us-east-2'
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID ?? '425629232910'
const BUCKET = process.env.AWS_S3_BUCKET ?? `glowlab-product-images-${ACCOUNT_ID}`

function run(cmd: string): void {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

function bucketExists(): boolean {
  try {
    execSync(`aws s3api head-bucket --bucket ${BUCKET}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function main(): void {
  if (!bucketExists()) {
    run(
      `aws s3api create-bucket --bucket ${BUCKET} --region ${REGION} --create-bucket-configuration LocationConstraint=${REGION}`,
    )
  } else {
    console.log(`Bucket ${BUCKET} ya existe.`)
  }

  run(
    `aws s3api put-public-access-block --bucket ${BUCKET} --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false`,
  )
  run(`aws s3api put-bucket-policy --bucket ${BUCKET} --policy file://scripts/s3-bucket-policy.json`)
  run(`aws s3api put-bucket-cors --bucket ${BUCKET} --cors-configuration file://scripts/s3-cors.json`)
  run(`aws s3api put-bucket-versioning --bucket ${BUCKET} --versioning-configuration Status=Enabled`)
  run(
    `aws s3api put-bucket-encryption --bucket ${BUCKET} --server-side-encryption-configuration file://scripts/s3-encryption.json`,
  )

  console.log('\nBucket listo:')
  console.log(`  Nombre: ${BUCKET}`)
  console.log(`  Región: ${REGION}`)
  console.log(`  Prefijo imágenes: products/`)
  console.log(`  URL ejemplo: https://${BUCKET}.s3.${REGION}.amazonaws.com/products/{productId}/archivo.jpg`)
}

main()
