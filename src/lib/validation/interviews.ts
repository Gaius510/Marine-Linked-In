import { z } from 'zod'
import { cuid, optionalText, requiredDateString } from './shared'

export const interviewCreateSchema = z.object({
  seafarerId: cuid,
  jobId: cuid.nullish().transform((value) => value || null),
  scheduledAt: requiredDateString,
  location: optionalText(160),
  notes: optionalText(3000),
}).strict()

export const interviewUpdateSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED'], { error: 'invalid_status' }),
}).strict()

export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>
export type InterviewUpdateInput = z.infer<typeof interviewUpdateSchema>
