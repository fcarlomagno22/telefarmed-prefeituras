import { z } from 'zod'
import { FUNCTIONAL_TRAINING_EXERCISE_IDS, FUNCTIONAL_TRAINING_MODES } from './types.js'

const isoDateTimeSchema = z
  .string()
  .trim()
  .min(1, 'Informe uma data/hora válida.')
  .refine((value) => Number.isFinite(Date.parse(value)), 'Informe uma data/hora válida.')

const clientSessionIdSchema = z
  .string()
  .trim()
  .min(8, 'Informe um identificador de sessão válido.')
  .max(64, 'Informe um identificador de sessão válido.')

const exerciseIdSchema = z
  .string()
  .trim()
  .min(1, 'Informe um exercício válido.')
  .refine(
    (value) => (FUNCTIONAL_TRAINING_EXERCISE_IDS as readonly string[]).includes(value),
    'Exercício inválido ou não disponível no catálogo.',
  )

export const functionalTrainingExerciseIdParamsSchema = z.object({
  exerciseId: exerciseIdSchema,
})

/** Body de POST /vd/functional-training/sessoes — alinhado a WorkoutSessionRecord. */
export const createFunctionalTrainingSessaoBodySchema = z.object({
  clientSessionId: clientSessionIdSchema,
  mode: z.enum(FUNCTIONAL_TRAINING_MODES),
  durationSec: z
    .number()
    .int('Informe uma duração válida em segundos.')
    .min(1, 'Informe uma duração válida em segundos.')
    .max(7_200, 'Informe uma duração válida em segundos.'),
  totalActiveSec: z
    .number()
    .int('Informe o tempo ativo válido em segundos.')
    .min(0, 'Informe o tempo ativo válido em segundos.')
    .max(7_200, 'Informe o tempo ativo válido em segundos.'),
  exerciseIds: z
    .array(exerciseIdSchema)
    .min(1, 'Informe ao menos um exercício válido.')
    .max(50, 'Informe ao menos um exercício válido.'),
  completedAt: isoDateTimeSchema,
})

/** Query de GET /vd/functional-training/sessoes */
export const listFunctionalTrainingSessoesQuerySchema = z.object({
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

/** Query de GET /vd/functional-training/estatisticas-semanais */
export const estatisticasSemanaisQuerySchema = z.object({
  weekStartIso: isoDateTimeSchema.optional(),
})

export function formatFunctionalTrainingValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inválidos.'
}
