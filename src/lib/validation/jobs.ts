import { z } from 'zod'
import { optionalDateString, optionalNumericString, optionalText, requiredText } from './shared'

export const jobCreateSchema = z.object({
  title: requiredText(160),
  rank: optionalText(120),
  vesselType: optionalText(120),
  companyName: optionalText(160),
  salaryMin: optionalNumericString(),
  salaryMax: optionalNumericString(),
  currency: z.string().trim().min(1, 'required').max(12, 'too_long').default('USD'),
  contractDuration: optionalText(120),
  joiningDate: optionalDateString,
  location: optionalText(160),
  description: optionalText(5000),
  requirements: optionalText(5000),
}).strict()

export const jobUpdateSchema = jobCreateSchema.partial().extend({
  status: z.enum(['OPEN', 'CLOSED'], { error: 'invalid_status' }).optional(),
}).strict()

export type JobCreateInput = z.infer<typeof jobCreateSchema>
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>
