import { z } from 'zod'
import {
  CONTEXTOS_GLICEMIA_PACIENTE,
  CONTEXTOS_FREQUENCIA_CARDIACA_PACIENTE,
  FREQUENCIA_CARDIACA_API_SOURCES,
  MEDIDAS_CORPORAIS_PACIENTE,
  METRICAS_INTEGRATION_IDS,
  METRICAS_INTEGRATION_PERMISSIONS,
  METRICAS_INTEGRATION_STATUSES,
} from './types.js'

const metricasBirthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data de nascimento v?lida.')
  .superRefine((value, ctx) => {
    const [yearRaw, monthRaw, dayRaw] = value.split('-')
    const year = Number(yearRaw)
    const month = Number(monthRaw)
    const day = Number(dayRaw)

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      year < 1920
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma data de nascimento v?lida.',
      })
      return
    }

    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma data de nascimento v?lida.',
      })
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma data de nascimento v?lida.',
      })
    }
  })

export const metricasGenderSchema = z.enum([
  'masculino',
  'feminino',
  'outros',
  'prefiro_nao_informar',
])

export const updateMetricasPerfilBodySchema = z
  .object({
    heightMeters: z
      .number()
      .min(0.5, 'Informe uma altura v?lida.')
      .max(2.5, 'Informe uma altura v?lida.')
      .optional(),
    weightKg: z
      .number()
      .min(20, 'Informe um peso v?lido.')
      .max(300, 'Informe um peso v?lido.')
      .optional(),
    birthDate: metricasBirthDateSchema.optional(),
    gender: metricasGenderSchema.optional(),
  })
  .refine(
    (data) =>
      data.heightMeters !== undefined ||
      data.weightKg !== undefined ||
      data.birthDate !== undefined ||
      data.gender !== undefined,
    { message: 'Informe ao menos um campo para atualizar.' },
  )

export const metricasPeriodQueryBaseSchema = z.object({
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
})

function refineMetricasPeriodQuery<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const query = data as { start?: string; end?: string }
    if (!query.start || !query.end) return

    const start = Date.parse(query.start)
    const end = Date.parse(query.end)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Per?odo inv?lido.',
      })
    }
  })
}

export const metricasPeriodQuerySchema = refineMetricasPeriodQuery(metricasPeriodQueryBaseSchema)

export const metricasPesoQuerySchema = metricasPeriodQuerySchema

export const metricasGlicemiaQuerySchema = metricasPeriodQuerySchema

export const metricasPressaoQuerySchema = metricasPeriodQuerySchema

export const metricasHidratacaoQuerySchema = metricasPeriodQuerySchema

export const metricasFrequenciaCardiacaQuerySchema = metricasPeriodQuerySchema

export const metricasAtividadeQuerySchema = metricasPeriodQuerySchema

export const metricasMedidaCorporalSchema = z.enum(MEDIDAS_CORPORAIS_PACIENTE)

/** Ranges alinhados a app_cidades/src/utils/bodyMeasurements.ts (cm). */
export const MEDIDA_CORPORAL_CM_RANGES = {
  abdomen: { min: 50, max: 150 },
  quadril: { min: 60, max: 160 },
  peito: { min: 60, max: 150 },
  cintura: { min: 50, max: 140 },
  coxa: { min: 35, max: 90 },
  braco: { min: 20, max: 55 },
  pescoco: { min: 28, max: 55 },
} as const satisfies Record<
  (typeof MEDIDAS_CORPORAIS_PACIENTE)[number],
  { min: number; max: number }
>

export const metricasMedidasCorporaisQuerySchema = refineMetricasPeriodQuery(
  metricasPeriodQueryBaseSchema.extend({
    tipo: metricasMedidaCorporalSchema.optional(),
  }),
)

export const metricasGlicemiaContextSchema = z.enum(CONTEXTOS_GLICEMIA_PACIENTE)

export const metricasFrequenciaCardiacaContextSchema = z.enum(
  CONTEXTOS_FREQUENCIA_CARDIACA_PACIENTE,
)

export const metricasFrequenciaCardiacaSourceSchema = z.enum(FREQUENCIA_CARDIACA_API_SOURCES)

/** Alinhado ao HeartRateHistoryDrawer (bpm por leitura). */
export const FREQUENCIA_CARDIACA_BPM_MIN = 35
export const FREQUENCIA_CARDIACA_BPM_MAX = 250

/** Alinhado a app_cidades/src/data/mockStepsHistory.ts */
export const ATIVIDADE_PASSOS_MIN = 1
export const ATIVIDADE_PASSOS_MAX = 100_000
export const ATIVIDADE_DISTANCIA_KM_MIN = 0.01
export const ATIVIDADE_DISTANCIA_KM_MAX = 200
export const ATIVIDADE_CAMINHADA_MINUTOS_MIN = 1
export const ATIVIDADE_CAMINHADA_MINUTOS_MAX = 600

/** Ranges cl?nicos alinhados ao BloodPressureLogDrawer (mmHg). */
export const PRESSAO_SISTOLICA_MIN = 80
export const PRESSAO_SISTOLICA_MAX = 200
export const PRESSAO_DIASTOLICA_MIN = 40
export const PRESSAO_DIASTOLICA_MAX = 130

/** Alinhado ao HydrationLogDrawer (ml por registro). */
export const HIDRATACAO_LOG_ML_MIN = 50
export const HIDRATACAO_LOG_ML_MAX = 3000

export const createMetricasPesoBodySchema = z.object({
  weightKg: z
    .number()
    .min(20, 'Informe um peso v?lido.')
    .max(300, 'Informe um peso v?lido.'),
  recordedAt: z.string().datetime({ offset: true }).optional(),
})

export const createMetricasGlicemiaBodySchema = z.object({
  amountMg: z
    .number()
    .min(50, 'Informe um valor de glicemia v?lido.')
    .max(600, 'Informe um valor de glicemia v?lido.'),
  context: metricasGlicemiaContextSchema,
  recordedAt: z.string().datetime({ offset: true }).optional(),
})

export const createMetricasPressaoBodySchema = z
  .object({
    systolic: z
      .number()
      .min(PRESSAO_SISTOLICA_MIN, 'Informe uma sist?lica v?lida.')
      .max(PRESSAO_SISTOLICA_MAX, 'Informe uma sist?lica v?lida.'),
    diastolic: z
      .number()
      .min(PRESSAO_DIASTOLICA_MIN, 'Informe uma diast?lica v?lida.')
      .max(PRESSAO_DIASTOLICA_MAX, 'Informe uma diast?lica v?lida.'),
    recordedAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine((data) => data.systolic > data.diastolic, {
    message: 'A sist?lica deve ser maior que a diast?lica.',
    path: ['systolic'],
  })

export const createMetricasHidratacaoBodySchema = z.object({
  amountMl: z
    .number()
    .min(HIDRATACAO_LOG_ML_MIN, 'Informe um volume v?lido.')
    .max(HIDRATACAO_LOG_ML_MAX, 'Informe um volume v?lido.'),
  recordedAt: z.string().datetime({ offset: true }).optional(),
})

export const createMetricasMedidasCorporaisBodySchema = z
  .object({
    measurementId: metricasMedidaCorporalSchema,
    valueCm: z.number(),
    recordedAt: z.string().datetime({ offset: true }).optional(),
  })
  .superRefine((data, ctx) => {
    const range = MEDIDA_CORPORAL_CM_RANGES[data.measurementId]
    if (data.valueCm < range.min || data.valueCm > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe uma medida v?lida.',
        path: ['valueCm'],
      })
    }
  })

export const createMetricasFrequenciaCardiacaBodySchema = z.object({
  bpm: z
    .number()
    .min(FREQUENCIA_CARDIACA_BPM_MIN, 'Informe uma frequ?ncia v?lida.')
    .max(FREQUENCIA_CARDIACA_BPM_MAX, 'Informe uma frequ?ncia v?lida.'),
  recordedAt: z.string().datetime({ offset: true }).optional(),
  source: metricasFrequenciaCardiacaSourceSchema.optional(),
  context: metricasFrequenciaCardiacaContextSchema.optional(),
  sourceLabel: z.string().trim().min(1).max(80).optional(),
})

export const createMetricasCaminhadaBodySchema = z
  .object({
    steps: z
      .number()
      .int('Informe um n?mero inteiro de passos.')
      .min(ATIVIDADE_PASSOS_MIN, 'Informe uma quantidade v?lida de passos.')
      .max(ATIVIDADE_PASSOS_MAX, 'Informe uma quantidade v?lida de passos.')
      .optional(),
    distanceKm: z
      .number()
      .min(ATIVIDADE_DISTANCIA_KM_MIN, 'Informe uma dist?ncia v?lida.')
      .max(ATIVIDADE_DISTANCIA_KM_MAX, 'Informe uma dist?ncia v?lida.')
      .optional(),
    durationMinutes: z
      .number()
      .int('Informe uma dura??o v?lida em minutos.')
      .min(ATIVIDADE_CAMINHADA_MINUTOS_MIN, 'Informe uma dura??o v?lida em minutos.')
      .max(ATIVIDADE_CAMINHADA_MINUTOS_MAX, 'Informe uma dura??o v?lida em minutos.')
      .optional(),
    recordedAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (data) =>
      data.steps !== undefined ||
      data.distanceKm !== undefined ||
      data.durationMinutes !== undefined,
    { message: 'Informe passos, dist?ncia ou dura??o.' },
  )

const atividadeDateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data v?lida.')

export const createMetricasAtividadeLoteBodySchema = z.object({
  days: z
    .array(
      z.object({
        date: atividadeDateKeySchema,
        steps: z
          .number()
          .int('Informe um n?mero inteiro de passos.')
          .min(ATIVIDADE_PASSOS_MIN, 'Informe uma quantidade v?lida de passos.')
          .max(ATIVIDADE_PASSOS_MAX, 'Informe uma quantidade v?lida de passos.'),
        distanceKm: z
          .number()
          .min(ATIVIDADE_DISTANCIA_KM_MIN, 'Informe uma dist?ncia v?lida.')
          .max(ATIVIDADE_DISTANCIA_KM_MAX, 'Informe uma dist?ncia v?lida.')
          .optional(),
        sourceLabel: z.string().trim().min(1).max(80).optional(),
      }),
    )
    .min(1, 'Informe ao menos um dia.')
    .max(90, 'Informe no m?ximo 90 dias.'),
})

export const metricasGlicemiaIdParamsSchema = z.object({
  id: z.string().uuid('Informe um identificador v?lido.'),
})

export const metricasIntegracaoIdParamsSchema = z.object({
  integrationId: z.enum(METRICAS_INTEGRATION_IDS, {
    message: 'Integra??o inv?lida.',
  }),
})

export const updateMetricasIntegracaoBodySchema = z.object({
  status: z.enum(METRICAS_INTEGRATION_STATUSES),
  permissions: z
    .array(z.enum(METRICAS_INTEGRATION_PERMISSIONS))
    .max(METRICAS_INTEGRATION_PERMISSIONS.length)
    .default([]),
  connectedAt: z.string().datetime({ offset: true }).optional(),
  connectedDeviceName: z.string().trim().min(1).max(120).optional(),
  lastSyncedAt: z.string().datetime({ offset: true }).optional(),
})

export const metricasLeituraQuerySchema = refineMetricasPeriodQuery(
  metricasPeriodQueryBaseSchema.extend({
    tipo: z
      .enum([
        'peso',
        'glicemia',
        'pressao',
        'hidratacao',
        'frequencia_cardiaca',
        'medida_corporal',
        'passos',
        'distancia',
      ])
      .optional(),
  }),
)

export function formatMetricasValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inv?lidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inv?lidos.'
}
