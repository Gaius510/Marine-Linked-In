import { z } from 'zod'
import {
  dateOrderIssue,
  optionalDateString,
  optionalNumericString,
  optionalText,
  requiredText,
} from './shared'

export const seafarerProfileUpdateSchema = z.object({
  phone: optionalText(60),
  city: optionalText(80),
  country: optionalText(80),
  rank: optionalText(120),
  nationality: optionalText(80),
  dateOfBirth: optionalDateString,
  availability: z.enum(['AVAILABLE', 'ON_BOARD', 'UNAVAILABLE'], { error: 'invalid_availability' }).optional(),
  availableFrom: optionalDateString,
  yearsExperience: optionalNumericString(),
  bio: optionalText(3000),
  cocGrade: optionalText(160),
  cocExpiry: optionalDateString,
  passportNo: optionalText(120),
  passportExpiry: optionalDateString,
  usVisa: optionalText(120),
  schengenVisa: optionalText(120),
}).strict()

const experienceBaseSchema = z.object({
  rank: optionalText(120),
  vesselType: requiredText(120),
  vesselName: optionalText(160),
  companyName: optionalText(160),
  imoNumber: optionalText(60),
  grossTonnage: optionalText(80),
  engineType: optionalText(120),
  tradeArea: optionalText(120),
  signOnDate: optionalDateString,
  signOffDate: optionalDateString,
  captainName: optionalText(120),
  captainContact: optionalText(120),
  chiefEngName: optionalText(120),
  chiefEngContact: optionalText(120),
}).strict()

export const experienceSchema = experienceBaseSchema.superRefine((data, ctx) => {
  if (dateOrderIssue(data.signOnDate, data.signOffDate)) {
    ctx.addIssue({ code: 'custom', path: ['signOffDate'], message: 'date_before_start' })
  }
})

export const experienceUpdateSchema = experienceBaseSchema.partial().superRefine((data, ctx) => {
  if (dateOrderIssue(data.signOnDate, data.signOffDate)) {
    ctx.addIssue({ code: 'custom', path: ['signOffDate'], message: 'date_before_start' })
  }
})

const certificateBaseSchema = z.object({
  name: requiredText(160),
  number: optionalText(120),
  issuedDate: optionalDateString,
  expiryDate: optionalDateString,
  issuingAuthority: optionalText(160),
}).strict()

export const certificateSchema = certificateBaseSchema.superRefine((data, ctx) => {
  if (dateOrderIssue(data.issuedDate, data.expiryDate)) {
    ctx.addIssue({ code: 'custom', path: ['expiryDate'], message: 'date_before_issue' })
  }
})

export const certificateUpdateSchema = certificateBaseSchema.partial().superRefine((data, ctx) => {
  if (dateOrderIssue(data.issuedDate, data.expiryDate)) {
    ctx.addIssue({ code: 'custom', path: ['expiryDate'], message: 'date_before_issue' })
  }
})

export type SeafarerProfileUpdateInput = z.infer<typeof seafarerProfileUpdateSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>
export type CertificateInput = z.infer<typeof certificateSchema>
export type CertificateUpdateInput = z.infer<typeof certificateUpdateSchema>
