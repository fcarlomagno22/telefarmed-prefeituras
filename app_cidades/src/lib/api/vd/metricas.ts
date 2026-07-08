import type { RegistrationGender } from '../../../utils/registrationGender'
import type { GlucoseReadingContext } from '../../../types/glucose'
import { vdRequest } from './client'

export type MetricsProfileDto = {
  height: string | null
  weight: string | null
  birthDate: string | null
  genderLabel: string | null
  ageYears: number | null
  ageLabel: string | null
  imc: number | null
  imcZone: string | null
}

export type UpdateMetricsProfileInput = {
  heightMeters?: number
  weightKg?: number
  birthDate?: string
  gender?: RegistrationGender
}

export async function getMetricsProfile(): Promise<MetricsProfileDto> {
  const result = await vdRequest<{ profile: MetricsProfileDto }>({
    method: 'GET',
    path: '/vd/metricas/perfil',
    credentials: 'include',
  })
  return result.profile
}

export async function updateMetricsProfile(
  input: UpdateMetricsProfileInput,
): Promise<MetricsProfileDto> {
  const result = await vdRequest<{ profile: MetricsProfileDto }>({
    method: 'PUT',
    path: '/vd/metricas/perfil',
    body: input,
    credentials: 'include',
  })
  return result.profile
}

export type MetricDataPointDto = {
  date: string
  value: number
  hour?: number
}

export type RegisterWeightResult = {
  point: MetricDataPointDto
  recordedAt: string
}

export type LatestWeightResult = {
  point: MetricDataPointDto | null
  recordedAt: string | null
}

export async function listWeightHistory(query?: {
  start?: string
  end?: string
}): Promise<MetricDataPointDto[]> {
  const result = await vdRequest<{ points: MetricDataPointDto[] }>({
    method: 'GET',
    path: '/vd/metricas/peso',
    query: {
      start: query?.start,
      end: query?.end,
    },
    credentials: 'include',
  })
  return result.points
}

export async function registerWeight(input: {
  weightKg: number
  recordedAt?: string
}): Promise<RegisterWeightResult> {
  return vdRequest<RegisterWeightResult>({
    method: 'POST',
    path: '/vd/metricas/peso',
    body: input,
    credentials: 'include',
  })
}

export async function getLatestWeight(): Promise<LatestWeightResult> {
  return vdRequest<LatestWeightResult>({
    method: 'GET',
    path: '/vd/metricas/peso/ultimo',
    credentials: 'include',
  })
}

export type GlucoseHistoryEntryDto = {
  id: string
  recordedAt: string
  amountMg: number
  context: GlucoseReadingContext
}

export type RegisterGlucoseResult = {
  reading: GlucoseHistoryEntryDto
}

export async function listGlucoseHistory(query?: {
  start?: string
  end?: string
}): Promise<GlucoseHistoryEntryDto[]> {
  const result = await vdRequest<{ readings: GlucoseHistoryEntryDto[] }>({
    method: 'GET',
    path: '/vd/metricas/glicemia',
    query: {
      start: query?.start,
      end: query?.end,
    },
    credentials: 'include',
  })
  return result.readings
}

export async function registerGlucose(input: {
  amountMg: number
  context: GlucoseReadingContext
  recordedAt?: string
}): Promise<RegisterGlucoseResult> {
  return vdRequest<RegisterGlucoseResult>({
    method: 'POST',
    path: '/vd/metricas/glicemia',
    body: input,
    credentials: 'include',
  })
}

export type BloodPressureHistoryEntryDto = {
  id: string
  recordedAt: string
  systolic: number
  diastolic: number
}

export type RegisterBloodPressureResult = {
  reading: BloodPressureHistoryEntryDto
}

export async function listBloodPressureHistory(query?: {
  start?: string
  end?: string
}): Promise<BloodPressureHistoryEntryDto[]> {
  const result = await vdRequest<{ readings: BloodPressureHistoryEntryDto[] }>({
    method: 'GET',
    path: '/vd/metricas/pressao',
    query: {
      start: query?.start,
      end: query?.end,
    },
    credentials: 'include',
  })
  return result.readings
}

export async function registerBloodPressure(input: {
  systolic: number
  diastolic: number
  recordedAt?: string
}): Promise<RegisterBloodPressureResult> {
  return vdRequest<RegisterBloodPressureResult>({
    method: 'POST',
    path: '/vd/metricas/pressao',
    body: input,
    credentials: 'include',
  })
}

export type HydrationDayRecordDto = {
  id: string
  date: string
  totalMl: number
}

export type RegisterHydrationResult = {
  day: HydrationDayRecordDto
  recordedAt: string
}

export async function listHydrationHistory(query?: {
  start?: string
  end?: string
}): Promise<HydrationDayRecordDto[]> {
  const result = await vdRequest<{ days: HydrationDayRecordDto[] }>({
    method: 'GET',
    path: '/vd/metricas/hidratacao',
    query: {
      start: query?.start,
      end: query?.end,
    },
    credentials: 'include',
  })
  return result.days
}

export async function registerHydration(input: {
  amountMl: number
  recordedAt?: string
}): Promise<RegisterHydrationResult> {
  return vdRequest<RegisterHydrationResult>({
    method: 'POST',
    path: '/vd/metricas/hidratacao',
    body: input,
    credentials: 'include',
  })
}

export type BodyMeasurementsHistoryDto = {
  measurements: Partial<
    Record<
      'abdomen' | 'quadril' | 'peito' | 'cintura' | 'coxa' | 'braco' | 'pescoco',
      MetricDataPointDto[]
    >
  >
}

export type RegisterBodyMeasurementResult = {
  measurementId:
    | 'abdomen'
    | 'quadril'
    | 'peito'
    | 'cintura'
    | 'coxa'
    | 'braco'
    | 'pescoco'
  point: MetricDataPointDto
  recordedAt: string
}

export async function listBodyMeasurements(query?: {
  start?: string
  end?: string
  tipo?:
    | 'abdomen'
    | 'quadril'
    | 'peito'
    | 'cintura'
    | 'coxa'
    | 'braco'
    | 'pescoco'
}): Promise<BodyMeasurementsHistoryDto> {
  return vdRequest<BodyMeasurementsHistoryDto>({
    method: 'GET',
    path: '/vd/metricas/medidas-corporais',
    query: {
      start: query?.start,
      end: query?.end,
      tipo: query?.tipo,
    },
    credentials: 'include',
  })
}

export async function registerBodyMeasurement(input: {
  measurementId:
    | 'abdomen'
    | 'quadril'
    | 'peito'
    | 'cintura'
    | 'coxa'
    | 'braco'
    | 'pescoco'
  valueCm: number
  recordedAt?: string
}): Promise<RegisterBodyMeasurementResult> {
  return vdRequest<RegisterBodyMeasurementResult>({
    method: 'POST',
    path: '/vd/metricas/medidas-corporais',
    body: input,
    credentials: 'include',
  })
}

export type HeartRateHistoryEntryDto = {
  id: string
  recordedAt: string
  bpm: number
  source: 'manual' | 'integracao'
  context: 'resting' | 'workout' | 'sleep' | 'manual'
  sourceLabel?: string
}

export type RegisterHeartRateResult = {
  reading: HeartRateHistoryEntryDto
}

export async function listHeartRateHistory(query?: {
  start?: string
  end?: string
}): Promise<{ readings: HeartRateHistoryEntryDto[] }> {
  return vdRequest<{ readings: HeartRateHistoryEntryDto[] }>({
    method: 'GET',
    path: '/vd/metricas/frequencia-cardiaca',
    query: {
      start: query?.start,
      end: query?.end,
    },
    credentials: 'include',
  })
}

export async function registerHeartRate(input: {
  bpm: number
  recordedAt?: string
  source?: 'manual' | 'integracao'
  context?: 'resting' | 'workout' | 'sleep' | 'manual'
  sourceLabel?: string
}): Promise<RegisterHeartRateResult> {
  return vdRequest<RegisterHeartRateResult>({
    method: 'POST',
    path: '/vd/metricas/frequencia-cardiaca',
    body: input,
    credentials: 'include',
  })
}

export type AtividadeDayRecordDto = {
  id: string
  date: string
  steps: number
  distanceKm: number
  source?: 'manual' | 'integracao'
  sourceLabel?: string
}

export type RegisterWalkResult = {
  day: AtividadeDayRecordDto
  recordedAt: string
}

export type AtividadeIntegracaoDayInputDto = {
  date: string
  steps: number
  distanceKm?: number
  sourceLabel?: string
}

export type SyncActivityDaysBatchResult = {
  days: AtividadeDayRecordDto[]
  importedCount: number
}

export async function listActivityHistory(query?: {
  start?: string
  end?: string
}): Promise<{ days: AtividadeDayRecordDto[] }> {
  return vdRequest<{ days: AtividadeDayRecordDto[] }>({
    method: 'GET',
    path: '/vd/metricas/atividade',
    query: {
      start: query?.start,
      end: query?.end,
    },
    credentials: 'include',
  })
}

export async function registerWalk(input: {
  steps?: number
  distanceKm?: number
  durationMinutes?: number
  recordedAt?: string
}): Promise<RegisterWalkResult> {
  return vdRequest<RegisterWalkResult>({
    method: 'POST',
    path: '/vd/metricas/atividade/caminhada',
    body: input,
    credentials: 'include',
  })
}

export async function syncActivityDaysBatch(input: {
  days: AtividadeIntegracaoDayInputDto[]
}): Promise<SyncActivityDaysBatchResult> {
  return vdRequest<SyncActivityDaysBatchResult>({
    method: 'POST',
    path: '/vd/metricas/atividade/lote',
    body: input,
    credentials: 'include',
  })
}

export type IntegracaoMetricasDto = {
  status: 'connected' | 'disconnected'
  permissions: string[]
  connectedAt: string | null
  lastSyncedAt?: string
  connectedDeviceName?: string
}

export type IntegracoesListResult = {
  integrations: Record<string, IntegracaoMetricasDto>
}

export type UpdateHealthIntegrationInput = {
  status: 'connected' | 'disconnected'
  permissions: string[]
  connectedAt?: string
  connectedDeviceName?: string
  lastSyncedAt?: string
}

export type UpdateHealthIntegrationResult = {
  integrationId: string
  integration: IntegracaoMetricasDto
}

export async function listHealthIntegrations(): Promise<IntegracoesListResult> {
  return vdRequest<IntegracoesListResult>({
    method: 'GET',
    path: '/vd/metricas/integracoes',
    credentials: 'include',
  })
}

export async function updateHealthIntegration(
  integrationId: string,
  input: UpdateHealthIntegrationInput,
): Promise<UpdateHealthIntegrationResult> {
  return vdRequest<UpdateHealthIntegrationResult>({
    method: 'PUT',
    path: `/vd/metricas/integracoes/${integrationId}`,
    body: input,
    credentials: 'include',
  })
}

export type MetricsResumoLatestDto = {
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

export type MetricsResumoDto = {
  profile: MetricsProfileDto
  profileComplete: boolean
  latest: MetricsResumoLatestDto
}

export async function getMetricsResumo(): Promise<MetricsResumoDto> {
  return vdRequest<MetricsResumoDto>({
    method: 'GET',
    path: '/vd/metricas/resumo',
    credentials: 'include',
  })
}
