import { z } from 'zod'
import { sanitizeSleepLogNotes } from './notes.js'
import { SLEEP_QUALITY_SCORES } from './types.js'

const isoDateTimeSchema = z
  .string()
  .trim()
  .min(1, 'Informe uma data/hora válida.')
  .refine((value) => Number.isFinite(Date.parse(value)), 'Informe uma data/hora válida.')

const clientLogIdSchema = z
  .string()
  .trim()
  .min(8, 'Informe um identificador de registro válido.')
  .max(64, 'Informe um identificador de registro válido.')

const sleepQualitySchema = z.coerce
  .number()
  .int('Informe uma qualidade válida.')
  .refine(
    (value): value is (typeof SLEEP_QUALITY_SCORES)[number] =>
      (SLEEP_QUALITY_SCORES as readonly number[]).includes(value),
    'Informe uma qualidade entre 1 e 5.',
  )

const notesSchema = z
  .string()
  .optional()
  .transform((value) => sanitizeSleepLogNotes(value))

export const sleepTimeRegistroIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador de registro válido.'),
})

/** Body de POST /vd/sleep-time/registros — alinhado a SleepLogEntry. */
export const createSleepTimeRegistroBodySchema = z
  .object({
    clientLogId: clientLogIdSchema,
    bedAt: isoDateTimeSchema,
    wakeAt: isoDateTimeSchema,
    quality: sleepQualitySchema,
    wakeCount: z.coerce
      .number()
      .int('Informe uma quantidade válida de despertares.')
      .min(0, 'Informe uma quantidade válida de despertares.')
      .max(20, 'Informe uma quantidade válida de despertares.'),
    notes: notesSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const bedMs = Date.parse(value.bedAt)
    const wakeMs = Date.parse(value.wakeAt)

    if (!Number.isFinite(bedMs) || !Number.isFinite(wakeMs)) {
      return
    }

    if (wakeMs <= bedMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O horário de acordar deve ser posterior ao horário de deitar.',
        path: ['wakeAt'],
      })
    }

    const durationMinutes = Math.round((wakeMs - bedMs) / 60_000)
    if (durationMinutes > 1440) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A duração do sono não pode exceder 24 horas.',
        path: ['wakeAt'],
      })
    }

    if (wakeMs > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não é possível registrar sono com data futura.',
        path: ['wakeAt'],
      })
    }
  })

/** Query de GET /vd/sleep-time/registros */
export const listSleepTimeRegistrosQuerySchema = z.object({
  startIso: isoDateTimeSchema.optional(),
  endIso: isoDateTimeSchema.optional(),
  page: z.coerce
    .number()
    .int('Informe uma página válida.')
    .min(1, 'Informe uma página válida.')
    .optional()
    .default(1),
  pageSize: z.coerce
    .number()
    .int('Informe um tamanho de página válido.')
    .min(1, 'Informe um tamanho de página válido.')
    .max(100, 'Informe um tamanho de página válido.')
    .optional()
    .default(20),
})

export function formatSleepTimeValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inválidos.'
}
