/** Tipos alinhados aos enums SQL da migration vd_paciente_metricas. */

export const TIPOS_METRICA_PACIENTE = [
  'peso',
  'glicemia',
  'pressao',
  'hidratacao',
  'frequencia_cardiaca',
  'medida_corporal',
  'passos',
  'distancia',
] as const

export type TipoMetricaPaciente = (typeof TIPOS_METRICA_PACIENTE)[number]

export const ORIGENS_METRICA_PACIENTE = [
  'manual',
  'integracao',
  'pos_consulta',
  'sistema',
] as const

export type OrigemMetricaPaciente = (typeof ORIGENS_METRICA_PACIENTE)[number]

export const CONTEXTOS_GLICEMIA_PACIENTE = [
  'fasting',
  'pre_meal',
  'post_meal',
  'bedtime',
  'other',
] as const

export type ContextoGlicemiaPaciente = (typeof CONTEXTOS_GLICEMIA_PACIENTE)[number]

export const MEDIDAS_CORPORAIS_PACIENTE = [
  'abdomen',
  'quadril',
  'peito',
  'cintura',
  'coxa',
  'braco',
  'pescoco',
] as const

export type MedidaCorporalPaciente = (typeof MEDIDAS_CORPORAIS_PACIENTE)[number]

/** Alinhado a app_cidades/src/types/heartRate.ts — HeartRateContext */
export const CONTEXTOS_FREQUENCIA_CARDIACA_PACIENTE = [
  'resting',
  'workout',
  'sleep',
  'manual',
] as const

export type ContextoFrequenciaCardiacaPaciente =
  (typeof CONTEXTOS_FREQUENCIA_CARDIACA_PACIENTE)[number]

export const FREQUENCIA_CARDIACA_API_SOURCES = ['manual', 'integracao'] as const

export type FrequenciaCardiacaApiSource = (typeof FREQUENCIA_CARDIACA_API_SOURCES)[number]

export type PacienteMetricasPerfilRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  altura_metros: number | null
  peso_kg: number | null
  criado_em: string
  atualizado_em: string
}

export type PacienteMetricasLeituraRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  tipo: TipoMetricaPaciente
  registrado_em: string
  origem: OrigemMetricaPaciente
  valor: number
  valor_secundario: number | null
  contexto_glicemia: ContextoGlicemiaPaciente | null
  medida_corporal: MedidaCorporalPaciente | null
  metadados: Record<string, unknown>
  criado_em: string
}

/** Escopo resolvido a partir do JWT do paciente VD. */
export type VdMetricasPacienteScope = {
  pacienteId: string
  entidadeContratanteId: string
  cpf: string
}

export type MetricasPerfilDto = {
  height: string | null
  weight: string | null
  birthDate: string | null
  genderLabel: string | null
  ageYears: number | null
  ageLabel: string | null
  imc: number | null
  imcZone: string | null
}

export type MetricasResumoLatestDto = {
  pesoKg: number | null
  imc: number | null
  imcZone: string | null
  glicemiaMgDl: number | null
  pressaoSistolica: number | null
  pressaoDiastolica: number | null
  hidratacaoMlHoje: number | null
  circunferenciaAbdomenCm: number | null
  frequenciaBpm: number | null
  passosHoje: number | null
  distanciaKmHoje: number | null
}

/** Últimos valores agregados para home / KPI strip do app cidadão. */
export type MetricasResumoDto = {
  profile: MetricasPerfilDto
  profileComplete: boolean
  latest: MetricasResumoLatestDto
}

export type MetricDataPointDto = {
  date: string
  value: number
  hour?: number
}

export type UltimoPesoDto = {
  point: MetricDataPointDto | null
  recordedAt: string | null
}

export type RegisterPesoResultDto = {
  point: MetricDataPointDto
  recordedAt: string
}

/** Alinhado a app_cidades/src/types/glucose.ts — GlucoseHistoryEntry */
export type GlucoseHistoryEntryDto = {
  id: string
  recordedAt: string
  amountMg: number
  context: ContextoGlicemiaPaciente
}

export type RegisterGlicemiaResultDto = {
  reading: GlucoseHistoryEntryDto
}

/** Alinhado a app_cidades/src/types/bloodPressure.ts — BloodPressureHistoryEntry */
export type BloodPressureHistoryEntryDto = {
  id: string
  recordedAt: string
  systolic: number
  diastolic: number
}

export type RegisterPressaoResultDto = {
  reading: BloodPressureHistoryEntryDto
}

/** Alinhado a app_cidades/src/types/hydration.ts — HydrationDayRecord */
export type HydrationDayRecordDto = {
  id: string
  date: string
  totalMl: number
}

export type RegisterHidratacaoResultDto = {
  day: HydrationDayRecordDto
  recordedAt: string
}

/** Alinhado a app_cidades/src/types/bodyMeasurements.ts — BodyMeasurementHistory */
export type MedidasCorporaisHistoricoDto = {
  measurements: Partial<Record<MedidaCorporalPaciente, MetricDataPointDto[]>>
}

export type RegisterMedidaCorporalResultDto = {
  measurementId: MedidaCorporalPaciente
  point: MetricDataPointDto
  recordedAt: string
}

/** Alinhado a app_cidades/src/types/heartRate.ts — HeartRateReading (API). */
export type HeartRateHistoryEntryDto = {
  id: string
  recordedAt: string
  bpm: number
  source: FrequenciaCardiacaApiSource
  context: ContextoFrequenciaCardiacaPaciente
  sourceLabel?: string
}

export type RegisterFrequenciaCardiacaResultDto = {
  reading: HeartRateHistoryEntryDto
}

/** Alinhado a app_cidades — StepsDayRecord + distanceKm na API. */
export type AtividadeDayRecordDto = {
  id: string
  date: string
  steps: number
  distanceKm: number
  source?: 'manual' | 'integracao'
  sourceLabel?: string
}

export type RegisterCaminhadaResultDto = {
  day: AtividadeDayRecordDto
  recordedAt: string
}

export type AtividadeIntegracaoDayInputDto = {
  date: string
  steps: number
  distanceKm?: number
  sourceLabel?: string
}

export type RegisterAtividadeLoteResultDto = {
  days: AtividadeDayRecordDto[]
  importedCount: number
}

/** Alinhado a app_cidades/src/types/healthIntegrations.ts */
export const METRICAS_INTEGRATION_IDS = [
  'apple-health',
  'health-connect',
  'devices',
] as const

export type MetricasIntegrationId = (typeof METRICAS_INTEGRATION_IDS)[number]

export const METRICAS_INTEGRATION_PERMISSIONS = [
  'steps',
  'distance',
  'heart-rate',
  'body',
] as const

export type MetricasIntegrationPermission = (typeof METRICAS_INTEGRATION_PERMISSIONS)[number]

export const METRICAS_INTEGRATION_STATUSES = ['connected', 'disconnected'] as const

export type MetricasIntegrationStatus = (typeof METRICAS_INTEGRATION_STATUSES)[number]

export type PacienteMetricasIntegracaoRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  integration_id: string
  status: MetricasIntegrationStatus
  permissions: unknown
  metadata: Record<string, unknown>
  conectado_em: string | null
  criado_em: string
  atualizado_em: string
}

export type IntegracaoMetricasDto = {
  status: MetricasIntegrationStatus
  permissions: string[]
  connectedAt: string | null
  lastSyncedAt?: string
  connectedDeviceName?: string
}

export type IntegracoesMetricasListDto = {
  integrations: Record<string, IntegracaoMetricasDto>
}

export type UpdateIntegracaoMetricasResultDto = {
  integrationId: string
  integration: IntegracaoMetricasDto
}
