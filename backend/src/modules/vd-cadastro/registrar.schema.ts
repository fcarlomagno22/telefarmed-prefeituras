import { z } from 'zod'
import { appPacienteRegistrationObjectSchema } from './registration.schema.js'

export const registrarBodySchema = appPacienteRegistrationObjectSchema.extend({
  slug: z.string().trim().optional(),
  host: z.string().trim().optional(),
})
