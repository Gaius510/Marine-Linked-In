import { z } from 'zod'
import { dateOrderIssue, optionalText } from './shared'

const travelAuthorizationType = z.enum([
  'US_C1_D',
  'SCHENGEN',
  'UK_TRANSIT_OR_SEAFARER',
  'AU_MARITIME_CREW',
  'OTHER',
])

function optionalDateTime() {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.union([z.string(), z.date(), z.null()]).optional()
  ).transform((value, ctx) => {
    if (value === '' || value === null || value === undefined) return null
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'invalid_date' })
      return z.NEVER
    }
    return date
  })
}

const travelAuthorizationShape = {
  type: travelAuthorizationType,
  customType: optionalText(120),
  countryCode: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
    z.union([z.string().regex(/^[A-Z]{2}$/, 'invalid_country_code'), z.null()]).optional()
  ).transform((value) => (value === '' || value === undefined ? null : value)),
  documentNumber: optionalText(160),
  issuedAt: optionalDateTime(),
  expiresAt: optionalDateTime(),
  notes: optionalText(2000),
}

export const travelAuthorizationCreateSchema = z.object(travelAuthorizationShape).strict().superRefine((data, ctx) => {
  if (data.type === 'OTHER' && !data.customType) {
    ctx.addIssue({ code: 'custom', path: ['customType'], message: 'custom_type_required' })
  }
  if (data.type !== 'OTHER' && data.customType) {
    ctx.addIssue({ code: 'custom', path: ['customType'], message: 'custom_type_not_allowed' })
  }
  if (dateOrderIssue(data.issuedAt?.toISOString(), data.expiresAt?.toISOString())) {
    ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'date_before_issue' })
  }
})

export const travelAuthorizationUpdateSchema = z.object(travelAuthorizationShape).strict().partial().superRefine((data, ctx) => {
  if (data.type === 'OTHER' && !data.customType) {
    ctx.addIssue({ code: 'custom', path: ['customType'], message: 'custom_type_required' })
  }
  if (data.type && data.type !== 'OTHER' && data.customType) {
    ctx.addIssue({ code: 'custom', path: ['customType'], message: 'custom_type_not_allowed' })
  }
  if (dateOrderIssue(data.issuedAt?.toISOString(), data.expiresAt?.toISOString())) {
    ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'date_before_issue' })
  }
})

export type TravelAuthorizationCreateInput = z.infer<typeof travelAuthorizationCreateSchema>
export type TravelAuthorizationUpdateInput = z.infer<typeof travelAuthorizationUpdateSchema>
