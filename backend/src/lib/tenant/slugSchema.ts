import { z } from 'zod'
import { normalizeTenantSlugInput, validateTenantSlug } from './slug.js'

export const tenantSlugZodSchema = z
  .string()
  .trim()
  .min(1, 'Informe o endereço público (slug).')
  .transform((value) => normalizeTenantSlugInput(value))
  .superRefine((slug, ctx) => {
    const message = validateTenantSlug(slug)
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message })
    }
  })
