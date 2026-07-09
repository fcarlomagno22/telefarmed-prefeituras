import { z } from 'zod'
import { ACTIVE_MIND_GAME_IDS } from './game-catalog.js'
import { ACTIVE_MIND_DIFFICULTIES } from './types.js'

const MAX_COMPLETED_AT_AGE_MS = 7 * 24 * 60 * 60 * 1000

const isoDateTimeSchema = z
  .string()
  .trim()
  .min(1, 'Informe uma data/hora válida.')
  .refine((value) => Number.isFinite(Date.parse(value)), 'Informe uma data/hora válida.')

const clientSessionIdSchema = z
  .string()
  .trim()
  .min(1, 'Informe um identificador de sessão válido.')
  .max(128, 'Informe um identificador de sessão válido.')

const gameIdSchema = z.enum(ACTIVE_MIND_GAME_IDS, {
  errorMap: () => ({ message: 'Jogo inválido ou não disponível no catálogo.' }),
})

const difficultySchema = z.enum(ACTIVE_MIND_DIFFICULTIES, {
  errorMap: () => ({ message: 'Informe uma dificuldade válida.' }),
})

const puzzleIdSchema = z
  .string()
  .trim()
  .min(1, 'Informe um identificador de puzzle válido.')
  .max(128, 'Informe um identificador de puzzle válido.')

const nonNegativeIntSchema = (label: string) =>
  z.coerce
    .number()
    .int(`Informe um valor válido para ${label}.`)
    .min(0, `Informe um valor válido para ${label}.`)

export const activeMindSessaoIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador de sessão válido.'),
})

/** Body de POST /vd/active-mind/sessoes */
export const createActiveMindSessaoBodySchema = z
  .object({
    clientSessionId: clientSessionIdSchema,
    gameId: gameIdSchema,
    difficulty: difficultySchema,
    puzzleId: puzzleIdSchema.optional(),
    durationSec: z.coerce
      .number()
      .int('Informe uma duração válida em segundos.')
      .min(1, 'Informe uma duração válida em segundos.')
      .max(86_400, 'Informe uma duração válida em segundos.')
      .optional(),
    attempts: nonNegativeIntSchema('tentativas'),
    correct: nonNegativeIntSchema('acertos'),
    errors: nonNegativeIntSchema('erros'),
    reveals: nonNegativeIntSchema('revelações'),
    completedAt: isoDateTimeSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const completedMs = Date.parse(value.completedAt)
    if (!Number.isFinite(completedMs)) {
      return
    }

    const nowMs = Date.now()

    if (completedMs > nowMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não é possível registrar sessão com data futura.',
        path: ['completedAt'],
      })
    }

    if (nowMs - completedMs > MAX_COMPLETED_AT_AGE_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A sessão não pode ter sido concluída há mais de 7 dias.',
        path: ['completedAt'],
      })
    }
  })

/** Query de GET /vd/active-mind/sessoes */
export const listActiveMindSessoesQuerySchema = z.object({
  startIso: isoDateTimeSchema.optional(),
  endIso: isoDateTimeSchema.optional(),
  gameId: gameIdSchema.optional(),
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
    .max(50, 'Informe um tamanho de página válido.')
    .optional()
    .default(20),
})

/** Query de GET /vd/active-mind/estatisticas-semanais */
export const estatisticasSemanaisQuerySchema = z.object({
  weekStartIso: isoDateTimeSchema.optional(),
})

export function formatActiveMindValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inválidos.'
}
