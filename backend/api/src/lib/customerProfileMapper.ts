import type { CustomerProfile, User } from '@prisma/client'
import {
  isCustomerProfileComplete,
  type CustomerProfileResponse,
} from '../models/customerProfile.js'

type UserWithProfile = User & { customerProfile: CustomerProfile | null }

export function toCustomerProfileResponse(user: UserWithProfile): CustomerProfileResponse {
  const cp = user.customerProfile
  const profileComplete = isCustomerProfileComplete({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    addressLine: cp?.addressLine,
    city: cp?.city,
    postalCode: cp?.postalCode,
    country: cp?.country,
    acceptsTerms: cp?.acceptsTerms ?? false,
    hasPassword: Boolean(user.passwordHash),
  })

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
    addressLine: cp?.addressLine ?? null,
    city: cp?.city ?? null,
    postalCode: cp?.postalCode ?? null,
    country: cp?.country ?? 'España',
    acceptsTerms: cp?.acceptsTerms ?? false,
    acceptsTermsAt: cp?.acceptsTermsAt?.toISOString() ?? null,
    termsVersion: cp?.termsVersion ?? null,
    completedAt: cp?.completedAt?.toISOString() ?? null,
    profileComplete,
    updatedAt: user.updatedAt.toISOString(),
  }
}

export const profileUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  passwordHash: true,
  passwordChangedAt: true,
  skinTone: true,
  skinType: true,
  preferredStyles: true,
  createdAt: true,
  updatedAt: true,
  customerProfile: true,
} as const
