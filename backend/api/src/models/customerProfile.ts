import { z } from 'zod'

/** Campos del formulario «Editar perfil» (datos personales). */
export const customerPersonalDataSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(9).max(32),
})

/** Campos de dirección de envío del formulario «Editar perfil». */
export const customerShippingAddressSchema = z.object({
  addressLine: z.string().trim().min(5).max(255),
  city: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(4).max(20),
  country: z.string().trim().min(2).max(80).default('España'),
})

/** Contraseña de acceso (se persiste como hash en User.passwordHash). */
export const customerPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/** Payload completo al guardar la pantalla «Editar perfil». */
export const upsertCustomerProfileSchema = customerPersonalDataSchema
  .merge(customerShippingAddressSchema)
  .extend({
    acceptsTerms: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar los términos de compra' }),
    }),
    termsVersion: z.string().trim().min(1).max(40).default('2026-06-14'),
    password: z.string().min(8).max(128).optional(),
    confirmPassword: z.string().min(8).max(128).optional(),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true
      return data.password === data.confirmPassword
    },
    { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] },
  )

export type CustomerPersonalData = z.infer<typeof customerPersonalDataSchema>
export type CustomerShippingAddress = z.infer<typeof customerShippingAddressSchema>
export type UpsertCustomerProfileInput = z.infer<typeof upsertCustomerProfileSchema>

/** Respuesta API alineada con tablas User + CustomerProfile. */
export type CustomerProfileResponse = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  passwordChangedAt: string | null
  addressLine: string | null
  city: string | null
  postalCode: string | null
  country: string
  acceptsTerms: boolean
  acceptsTermsAt: string | null
  termsVersion: string | null
  completedAt: string | null
  profileComplete: boolean
  updatedAt: string
}

export function isCustomerProfileComplete(input: {
  firstName: string | null | undefined
  lastName: string | null | undefined
  email: string
  phone: string | null | undefined
  addressLine: string | null | undefined
  city: string | null | undefined
  postalCode: string | null | undefined
  country: string | null | undefined
  acceptsTerms: boolean
  hasPassword: boolean
}): boolean {
  return (
    Boolean(input.firstName && input.firstName.trim().length >= 2) &&
    Boolean(input.lastName && input.lastName.trim().length >= 2) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) &&
    Boolean(input.phone && input.phone.trim().length >= 9) &&
    Boolean(input.addressLine && input.addressLine.trim().length >= 5) &&
    Boolean(input.city && input.city.trim().length >= 2) &&
    Boolean(input.postalCode && input.postalCode.trim().length >= 4) &&
    Boolean(input.country && input.country.trim().length >= 2) &&
    input.acceptsTerms &&
    input.hasPassword
  )
}
