-- Perfil de cliente (pantalla Editar perfil): envío, términos y acceso completo.

-- AlterTable: datos personales y contraseña en User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(32);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- CreateTable: dirección de envío y consentimiento (1:1 con User)
CREATE TABLE IF NOT EXISTS "customer_profiles" (
    "userId" TEXT NOT NULL,
    "addressLine" VARCHAR(255),
    "city" VARCHAR(120),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(80) NOT NULL DEFAULT 'España',
    "acceptsTerms" BOOLEAN NOT NULL DEFAULT false,
    "acceptsTermsAt" TIMESTAMP(3),
    "termsVersion" VARCHAR(40) DEFAULT '2026-06-14',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "customer_profiles"
      ADD CONSTRAINT "customer_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
