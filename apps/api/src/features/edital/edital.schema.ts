import { z } from 'zod'

export const editalStatusSchema = z.enum(['open', 'closed', 'draft'])

export const createEditalSchema = z.object({
  title: z.string().optional(),
  org: z.string().optional(),
  area: z.string().optional(),
  status: editalStatusSchema.optional(),
  publishDate: z.string().optional(),
  deadline: z.string().optional(),
})

export const updateEditalSchema = z.object({
  title: z.string().optional(),
  org: z.string().optional(),
  area: z.string().optional(),
  status: editalStatusSchema.optional(),
  publishDate: z.string().optional(),
  deadline: z.string().optional(),
})

export type CreateEditalInput = z.infer<typeof createEditalSchema>
export type UpdateEditalInput = z.infer<typeof updateEditalSchema>