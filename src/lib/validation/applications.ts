import { z } from 'zod'
import { cuid, optionalText } from './shared'

export const applicationCreateSchema = z.object({
  jobId: cuid,
  message: optionalText(3000),
}).strict()

export const applicationUpdateSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'], { error: 'invalid_status' }),
}).strict()

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>
