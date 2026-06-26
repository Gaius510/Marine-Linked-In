import { z } from 'zod'
import { cuid, optionalFutureDateString, optionalText, requiredFutureDateString } from './shared'

export const interviewCreateSchema = z.object({
  seafarerId: cuid,
  jobId: cuid.nullish().transform((value) => value || null),
  scheduledAt: requiredFutureDateString,
  location: optionalText(160),
  notes: optionalText(3000),
}).strict()

export const interviewUpdateSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED'], { error: 'invalid_status' }).optional(),
  scheduledAt: optionalFutureDateString,
  location: optionalText(160),
  notes: optionalText(3000),
}).strict()

export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>
export type InterviewUpdateInput = z.infer<typeof interviewUpdateSchema>
