import { z } from 'zod'
import { optionalText, requiredText } from './shared'

export const loginSchema = z.object({
  email: z.string().trim().email('invalid_email').toLowerCase(),
  password: z.string().min(1, 'required'),
}).strict()

export const registerSchema = z.object({
  email: z.string().trim().email('invalid_email').toLowerCase(),
  password: z.string().min(6, 'short_password'),
  name: requiredText(120),
  role: z.enum(['SEAFARER', 'RECRUITER'], { error: 'invalid_role' }),
  company: optionalText(160),
  phone: optionalText(60),
  city: optionalText(80),
  country: optionalText(80),
}).strict().superRefine((data, ctx) => {
  if (data.role === 'RECRUITER' && !data.company) {
    ctx.addIssue({ code: 'custom', path: ['company'], message: 'company_required' })
  }
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
