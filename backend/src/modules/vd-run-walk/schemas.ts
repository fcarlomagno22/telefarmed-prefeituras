import { z } from 'zod'
import {
  RUNNING_ROUTE_LOCATION_SOURCES,
  RUNNING_ROUTE_SPOT_TYPES,
  RUNNING_ROUTE_SPOT_VOTES,
  RUN_WALK_ACTIVITY_CHECK_IN_DISCOMFORTS,
  RUN_WALK_ACTIVITY_CHECK_IN_INTENSITIES,
  RUN_WALK_ACTIVITY_CHECK_IN_WELLBEINGS,
  RUN_WALK_ACTIVITY_MENU_ACTIONS,
  RUN_WALK_ACTIVITY_TYPES,
  RUN_WALK_DISPOSITION_MOODS,
  RUN_WALK_INTENSITIES,
  RUN_WALK_MODALITIES,
  TODAY_ACTIVITY_PRESET_IDS,
} from './types.js'

const isoDateTimeSchema = z
  .string()
  .trim()
  .min(1, 'Informe uma data/hora válida.')
  .refine((value) => Number.isFinite(Date.parse(value)), 'Informe uma data/hora válida.')

const clientActivityIdSchema = z
  .string()
  .trim()
  .min(8, 'Informe um identificador de atividade válido.')
  .max(64, 'Informe um identificador de atividade válido.')

const trailPointSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Informe uma latitude válida.')
    .max(90, 'Informe uma latitude válida.'),
  longitude: z
    .number()
    .min(-180, 'Informe uma longitude válida.')
    .max(180, 'Informe uma longitude válida.'),
  recordedAt: z
    .number()
    .finite('Informe um timestamp de GPS válido.')
    .nonnegative('Informe um timestamp de GPS válido.'),
})

const checkInSchema = z.object({
  intensity: z.enum(RUN_WALK_ACTIVITY_CHECK_IN_INTENSITIES),
  wellbeing: z.enum(RUN_WALK_ACTIVITY_CHECK_IN_WELLBEINGS),
  discomfort: z.enum(RUN_WALK_ACTIVITY_CHECK_IN_DISCOMFORTS),
  note: z.string().trim().max(500).nullable(),
  answeredAt: isoDateTimeSchema,
})

/**
 * Body de PATCH /vd/run-walk/atividades/:id/checkin — alinhado a RunWalkActivityCheckIn.
 *
 * Decisão de fluxo (Fase 5):
 * - POST /atividades continua aceitando checkIn/checkInSkipped no registro inicial (caminho feliz
 *   atual: resumo envia tudo junto após a tela de check-in local).
 * - PATCH é o caminho de atualização quando a atividade já existe no servidor (ex.: POST antecipado
 *   no resumo → check-in depois), pois o POST idempotente por clientActivityId não mescla check-in.
 */
export const patchAtividadeCheckinBodySchema = z.union([
  z.object({ checkIn: checkInSchema }),
  z.object({ checkInSkipped: z.literal(true) }),
])

/** Body de POST /vd/run-walk/atividades — alinhado a RunWalkActivitySummary. */
export const createRunWalkAtividadeBodySchema = z.object({
  clientActivityId: clientActivityIdSchema,
  modality: z.enum(RUN_WALK_MODALITIES),
  activityName: z.string().trim().min(1, 'Informe o nome da atividade.').max(120),
  elapsedSeconds: z
    .number()
    .int('Informe uma duração válida em segundos.')
    .min(0, 'Informe uma duração válida em segundos.')
    .max(86_400, 'Informe uma duração válida em segundos.'),
  distanceKm: z
    .number()
    .min(0, 'Informe uma distância válida.')
    .max(250, 'Informe uma distância válida.'),
  averageSpeedKmh: z
    .number()
    .min(0, 'Informe uma velocidade média válida.')
    .max(40, 'Informe uma velocidade média válida.')
    .nullable()
    .optional(),
  paceMinPerKm: z
    .number()
    .min(0, 'Informe um pace válido.')
    .max(120, 'Informe um pace válido.')
    .nullable()
    .optional(),
  stepCount: z
    .number()
    .int('Informe uma contagem de passos válida.')
    .min(0, 'Informe uma contagem de passos válida.')
    .max(200_000, 'Informe uma contagem de passos válida.'),
  heartRateBpm: z
    .number()
    .int('Informe uma frequência cardíaca válida.')
    .min(0, 'Informe uma frequência cardíaca válida.')
    .max(250, 'Informe uma frequência cardíaca válida.'),
  estimatedCalories: z
    .number()
    .int('Informe um valor calórico válido.')
    .min(0, 'Informe um valor calórico válido.')
    .max(20_000, 'Informe um valor calórico válido.'),
  activeMinutes: z
    .number()
    .int('Informe minutos ativos válidos.')
    .min(0, 'Informe minutos ativos válidos.')
    .max(1_440, 'Informe minutos ativos válidos.'),
  completedAt: isoDateTimeSchema,
  trail: z.array(trailPointSchema).max(5_000, 'Trail GPS excede o limite permitido.'),
  trailPointCount: z
    .number()
    .int('Informe a contagem de pontos do trail.')
    .min(0, 'Informe a contagem de pontos do trail.')
    .max(100_000, 'Informe a contagem de pontos do trail.')
    .optional(),
  locationCity: z.string().trim().max(120).nullable().optional(),
  locationState: z.string().trim().max(80).nullable().optional(),
  checkIn: checkInSchema.nullable().optional(),
  checkInSkipped: z.boolean().optional(),
})

export const RUN_WALK_HISTORY_PERIODS = ['7d', '30d', '90d', 'all'] as const
export const RUN_WALK_HISTORY_SORTS = ['recent', 'distance', 'duration'] as const

export const RUN_WALK_HISTORY_CHART_METRICS = ['minutes', 'distance'] as const

/** Query de GET /vd/run-walk/atividades/resumo — agregações do histórico. */
export const resumoRunWalkAtividadesQuerySchema = z.object({
  period: z.enum(RUN_WALK_HISTORY_PERIODS).optional(),
  startIso: isoDateTimeSchema.optional(),
  endIso: isoDateTimeSchema.optional(),
  minDistanceKm: z.coerce
    .number()
    .min(0, 'Informe uma distância mínima válida.')
    .max(250, 'Informe uma distância mínima válida.')
    .optional()
    .default(0),
  chartMetric: z.enum(RUN_WALK_HISTORY_CHART_METRICS).optional().default('minutes'),
})

/** Query de GET /vd/run-walk/atividades — alinhado a RunWalkHistoryTab. */
export const listRunWalkAtividadesQuerySchema = z.object({
  period: z.enum(RUN_WALK_HISTORY_PERIODS).optional(),
  startIso: isoDateTimeSchema.optional(),
  endIso: isoDateTimeSchema.optional(),
  sort: z.enum(RUN_WALK_HISTORY_SORTS).optional().default('recent'),
  minDistanceKm: z.coerce
    .number()
    .min(0, 'Informe uma distância mínima válida.')
    .max(250, 'Informe uma distância mínima válida.')
    .optional()
    .default(0),
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

export const runWalkAtividadeIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador válido.'),
})

export const runWalkLiveSessionIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador válido.'),
})

const liveSharePointInputSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Informe uma latitude válida.')
    .max(90, 'Informe uma latitude válida.'),
  longitude: z
    .number()
    .min(-180, 'Informe uma longitude válida.')
    .max(180, 'Informe uma longitude válida.'),
  accuracyMeters: z
    .number()
    .min(0, 'Informe uma precisão válida.')
    .max(5000, 'Informe uma precisão válida.')
    .nullable()
    .optional(),
  recordedAt: isoDateTimeSchema.optional(),
})

/** Body de POST /vd/run-walk/live-sessoes */
export const createLiveSessionBodySchema = z.object({
  participantName: z.string().trim().min(1, 'Informe o nome do participante.').max(120),
  activityName: z.string().trim().min(1, 'Informe o nome da atividade.').max(120),
  initialPoint: liveSharePointInputSchema.optional(),
})

/** Body de POST /vd/run-walk/live-sessoes/:id/pontos */
export const appendLiveSessionPointsBodySchema = z.object({
  points: z
    .array(liveSharePointInputSchema)
    .min(1, 'Informe ao menos um ponto GPS.')
    .max(50, 'Envie no máximo 50 pontos por requisição.'),
})

/** Body de PUT /vd/run-walk/metas-semanais — alinhado a WeeklyGoalTargets. */
export const upsertMetasSemanaisBodySchema = z.object({
  targetActivities: z.coerce
    .number()
    .int('Informe um número inteiro de atividades.')
    .min(1, 'Informe pelo menos 1 atividade por semana.')
    .max(14, 'Informe no máximo 14 atividades por semana.'),
  targetActiveMinutes: z.coerce
    .number()
    .int('Informe minutos ativos válidos.')
    .min(1, 'Informe pelo menos 1 minuto ativo por semana.')
    .max(600, 'Informe no máximo 600 minutos ativos por semana.'),
  targetMovementDays: z.coerce
    .number()
    .int('Informe dias de movimento válidos.')
    .min(1, 'Informe pelo menos 1 dia de movimento por semana.')
    .max(7, 'Informe no máximo 7 dias de movimento por semana.'),
})

/** Body de POST /vd/run-walk/disposicao/checkin — alinhado a DispositionCheckinAnswers. */
export const createDisposicaoCheckinBodySchema = z.object({
  mood: z.enum(RUN_WALK_DISPOSITION_MOODS),
  sleptWell: z.boolean().optional(),
  hasPain: z.boolean().optional(),
  lowEnergy: z.boolean().optional(),
  preferLighter: z.boolean().optional(),
  preferWalkOverRun: z.boolean().optional(),
})

const todayActivityStepSchema = z.object({
  label: z.string().trim().min(1, 'Informe a estrutura da atividade.').max(200),
})

const todayActivityCustomizeSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  type: z.enum(RUN_WALK_ACTIVITY_TYPES).optional(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, 'Informe uma duração válida.')
    .max(300, 'Informe uma duração válida.')
    .optional(),
  intensity: z.enum(RUN_WALK_INTENSITIES).optional(),
  intensityLabel: z.string().trim().min(1).max(80).optional(),
  goal: z.string().trim().min(1).max(200).optional(),
  structure: z.array(todayActivityStepSchema).min(1).max(20).optional(),
  estimatedDistanceKm: z.coerce.number().min(0).max(250).optional(),
  recommendedPace: z.string().trim().min(1).max(200).optional(),
  terrain: z.string().trim().min(1).max(120).optional(),
  audioGuidance: z.boolean().optional(),
  warmup: z.string().trim().min(1).max(200).optional(),
  cooldown: z.string().trim().min(1).max(200).optional(),
  importantCautions: z.array(z.string().trim().min(1).max(200)).min(1).max(10).optional(),
})

/** Body de PUT /vd/run-walk/plano/hoje — selecionar preset e/ou customizar campos. */
export const upsertPlanoHojeBodySchema = z
  .object({
    presetId: z.enum(TODAY_ACTIVITY_PRESET_IDS).optional(),
    activity: todayActivityCustomizeSchema.optional(),
  })
  .refine((value) => value.presetId != null || value.activity != null, {
    message: 'Informe presetId ou campos de activity para atualizar o plano.',
  })

/** Body de POST /vd/run-walk/plano/hoje/acoes — alinhado a ActivityMenuAction. */
export const applyPlanoHojeAcaoBodySchema = z.object({
  action: z.enum(RUN_WALK_ACTIVITY_MENU_ACTIONS),
})

const brazilPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Informe um telefone brasileiro válido com DDD.')
  .refine((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 10 || digits.length === 11
  }, 'Informe um telefone brasileiro válido com DDD.')

export const runWalkContatoConfiancaIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador válido.'),
})

/** Body de POST /vd/run-walk/contatos-confianca — alinhado a TrustedContact. */
export const createContatoConfiancaBodySchema = z.object({
  clientContactId: z
    .string()
    .trim()
    .min(8, 'Informe um identificador local válido.')
    .max(80, 'Informe um identificador local válido.'),
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome do contato.')
    .max(120, 'Informe o nome do contato.'),
  phone: brazilPhoneSchema,
  liveShareEnabled: z.boolean().optional(),
  isActiveSos: z.boolean().optional(),
})

/** Body de PUT /vd/run-walk/contatos-confianca/:id */
export const updateContatoConfiancaBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Informe o nome do contato.')
      .max(120, 'Informe o nome do contato.')
      .optional(),
    phone: brazilPhoneSchema.optional(),
    liveShareEnabled: z.boolean().optional(),
    isActiveSos: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.phone !== undefined ||
      value.liveShareEnabled !== undefined ||
      value.isActiveSos !== undefined,
    { message: 'Informe ao menos um campo para atualizar.' },
  )

/** Query de GET /vd/run-walk/locais */
export const listRunWalkLocaisQuerySchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, 'Informe coordenadas válidas.')
    .max(90, 'Informe coordenadas válidas.'),
  longitude: z.coerce
    .number()
    .min(-180, 'Informe coordenadas válidas.')
    .max(180, 'Informe coordenadas válidas.'),
  radiusKm: z.coerce.number().min(1).max(150).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

/** Body de POST /vd/run-walk/locais */
export const createRunWalkLocalBodySchema = z.object({
  name: z.string().trim().min(3, 'Informe um nome com pelo menos 3 caracteres.').max(120),
  description: z.string().trim().max(2000).optional().default(''),
  type: z.enum(RUNNING_ROUTE_SPOT_TYPES),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  addressLabel: z.string().trim().min(1).max(300),
  locationSource: z.enum(RUNNING_ROUTE_LOCATION_SOURCES),
  coverPhotoStoragePath: z.string().trim().min(8).max(500).optional(),
  coverPhotoUrl: z.string().trim().min(8).max(2000).optional(),
  submittedByName: z.string().trim().min(1).max(120).optional(),
})

export const runWalkLocalIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador válido.'),
})

/** Body de POST /vd/run-walk/locais/:id/voto */
export const postRunWalkLocalVotoBodySchema = z.object({
  vote: z.enum(RUNNING_ROUTE_SPOT_VOTES).nullable(),
})

/** Query de GET /vd/run-walk/locais/:id/comentarios */
export const listRunWalkLocalComentariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
})

/** Body de POST /vd/run-walk/locais/:id/comentarios */
export const createRunWalkLocalComentarioBodySchema = z.object({
  text: z.string().trim().min(1, 'Informe o texto do comentário.').max(2000),
  authorName: z.string().trim().min(1).max(120).optional(),
})

export const runWalkIntegracoesLeiturasTempoRealQuerySchema = z.object({
  sessionStartedAt: z.string().datetime({ offset: true }).optional(),
  maxAgeSeconds: z.coerce.number().int().min(15).max(900).optional(),
})

export const upsertPreparacaoRascunhoBodySchema = z.object({
  modality: z.enum(RUN_WALK_MODALITIES),
  activityName: z.string().trim().min(1, 'Informe o nome da atividade.').max(120),
  intensity: z.string().trim().min(1, 'Informe a intensidade.').max(80),
  durationMinutes: z
    .number()
    .int('Informe uma duração válida em minutos.')
    .min(1, 'Informe uma duração válida em minutos.')
    .max(480, 'Informe uma duração válida em minutos.'),
  audioConfigured: z.boolean(),
})

export function formatRunWalkValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inválidos.'
}
