import { z } from 'zod'
import { cuid, optionalText, requiredText } from './shared'

export const messageCreateSchema = z.object({
  seafarerId: cuid.optional(),
  seafarerIds: z.array(cuid).optional(),
  subject: optionalText(200),
  body: requiredText(5000),
}).strict().transform((data, ctx) => {
  const ids = data.seafarerIds ?? (data.seafarerId ? [data.seafarerId] : [])
  const uniqueIds = Array.from(new Set(ids))
  if (uniqueIds.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['seafarerId'], message: 'required' })
    return z.NEVER
  }
  return {
    seafarerIds: uniqueIds,
    subject: data.subject || 'Message from a recruiter',
    body: data.body,
  }
})

export const savedProfilesCreateSchema = z.object({
  seafarerId: cuid.optional(),
  seafarerIds: z.array(cuid).optional(),
}).strict().transform((data, ctx) => {
  const ids = data.seafarerIds ?? (data.seafarerId ? [data.seafarerId] : [])
  const uniqueIds = Array.from(new Set(ids))
  if (uniqueIds.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['seafarerId'], message: 'required' })
    return z.NEVER
  }
  return { seafarerIds: uniqueIds }
})

export type MessageCreateInput = z.infer<typeof messageCreateSchema>
export type SavedProfilesCreateInput = z.infer<typeof savedProfilesCreateSchema>
