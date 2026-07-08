import type { ActivityModality } from '../../../types/auth'
import type { RunWalkActivityCheckIn } from '../../../types/runWalkActivityCheckIn'
import { vdRequest } from './client'

export type RunWalkTrailPointDto = {
  latitude: number
  longitude: number
  recordedAt: number
}

export type RunWalkActivityCheckInDto = {
  intensity: string
  wellbeing: string
  discomfort: string
  note: string | null
  answeredAt: string
}

export type RunWalkAtividadeDto = {
  id: string
  clientActivityId: string
  modality: ActivityModality
  activityName: string
  elapsedSeconds: number
  distanceKm: number
  averageSpeedKmh: number | null
  paceMinPerKm: number | null
  stepCount: number
  heartRateBpm: number
  estimatedCalories: number
  activeMinutes: number
  completedAt: string
  trail: RunWalkTrailPointDto[]
  trailPointCount: number
  locationCity: string | null
  locationState: string | null
  checkIn: RunWalkActivityCheckInDto | null
  checkInSkipped: boolean
  createdAt: string
  updatedAt: string
}

export type RunWalkAtividadeSummaryDto = Omit<RunWalkAtividadeDto, 'trail'>

export type RunWalkAtividadeDetailDto = RunWalkAtividadeSummaryDto & {
  trailSimplified: RunWalkTrailPointDto[]
}

export type RunWalkAtividadeListResultDto = {
  activities: RunWalkAtividadeSummaryDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type CreateRunWalkAtividadeInput = {
  clientActivityId: string
  modality: ActivityModality
  activityName: string
  elapsedSeconds: number
  distanceKm: number
  averageSpeedKmh?: number | null
  paceMinPerKm?: number | null
  stepCount: number
  heartRateBpm: number
  estimatedCalories: number
  activeMinutes: number
  completedAt: string
  trail: RunWalkTrailPointDto[]
  trailPointCount?: number
  locationCity?: string | null
  locationState?: string | null
  checkIn?: RunWalkActivityCheckIn | null
  checkInSkipped?: boolean
}

export type RegisterRunWalkAtividadeResult = {
  activity: RunWalkAtividadeDto
}

export type ListRunWalkAtividadesQuery = {
  period?: '7d' | '30d' | '90d' | 'all'
  startIso?: string
  endIso?: string
  sort?: 'recent' | 'distance' | 'duration'
  minDistanceKm?: number
  page?: number
  pageSize?: number
}

export type RunWalkResumoPeriodSummaryDto = {
  totalDistanceKm: number
  totalActiveMinutes: number
  totalWorkouts: number
  totalCalories: number
  distanceDeltaPct: number | null
  minutesDeltaPct: number | null
  workoutsDeltaPct: number | null
  caloriesDeltaPct: number | null
}

export type RunWalkResumoTrendPointDto = {
  id: string
  label: string
  value: number
  dateIso: string
  activityName: string
}

export type RunWalkResumoHeatmapCellDto = {
  dateIso: string
  day: number
  intensity: number
  activeMinutes: number
  distanceKm: number
  hasActivity: boolean
}

export type RunWalkResumoHighlightDto = {
  id: string
  title: string
  value: string
  subtitle: string
  accent: string
  activityId?: string
}

export type RunWalkResumoChartDayDto = {
  dateIso: string
  dayLabel: string
  weekdayShort: string
  dateShort: string
  isToday: boolean
  isFuture: boolean
  activeMinutes: number
  distanceKm: number
}

export type RunWalkAtividadesResumoDto = {
  periodSummary: RunWalkResumoPeriodSummaryDto
  trendPoints: RunWalkResumoTrendPointDto[]
  heatmapCells: RunWalkResumoHeatmapCellDto[]
  highlights: RunWalkResumoHighlightDto[]
  chartDays: RunWalkResumoChartDayDto[]
}

export type ResumoRunWalkAtividadesQuery = {
  period?: '7d' | '30d' | '90d' | 'all'
  startIso?: string
  endIso?: string
  minDistanceKm?: number
  chartMetric?: 'minutes' | 'distance'
}

export async function listRunWalkAtividades(
  query?: ListRunWalkAtividadesQuery,
): Promise<RunWalkAtividadeListResultDto> {
  return vdRequest<RunWalkAtividadeListResultDto>({
    method: 'GET',
    path: '/vd/run-walk/atividades',
    query: {
      period: query?.period,
      startIso: query?.startIso,
      endIso: query?.endIso,
      sort: query?.sort,
      minDistanceKm:
        query?.minDistanceKm != null ? String(query.minDistanceKm) : undefined,
      page: query?.page != null ? String(query.page) : undefined,
      pageSize: query?.pageSize != null ? String(query.pageSize) : undefined,
    },
    credentials: 'include',
  })
}

export async function listAllRunWalkAtividades(
  query?: Omit<ListRunWalkAtividadesQuery, 'page' | 'pageSize'>,
): Promise<RunWalkAtividadeSummaryDto[]> {
  const pageSize = 100
  let page = 1
  const activities: RunWalkAtividadeSummaryDto[] = []

  while (true) {
    const result = await listRunWalkAtividades({
      ...query,
      period: query?.period ?? 'all',
      page,
      pageSize,
    })

    activities.push(...result.activities)

    if (!result.hasMore) break
    page += 1
  }

  return activities
}

export async function getRunWalkAtividade(
  id: string,
): Promise<{ activity: RunWalkAtividadeDetailDto }> {
  return vdRequest<{ activity: RunWalkAtividadeDetailDto }>({
    method: 'GET',
    path: `/vd/run-walk/atividades/${id}`,
    credentials: 'include',
  })
}

export async function getRunWalkAtividadesResumo(
  query?: ResumoRunWalkAtividadesQuery,
): Promise<RunWalkAtividadesResumoDto> {
  return vdRequest<RunWalkAtividadesResumoDto>({
    method: 'GET',
    path: '/vd/run-walk/atividades/resumo',
    query: {
      period: query?.period,
      startIso: query?.startIso,
      endIso: query?.endIso,
      minDistanceKm:
        query?.minDistanceKm != null ? String(query.minDistanceKm) : undefined,
      chartMetric: query?.chartMetric,
    },
    credentials: 'include',
  })
}

export async function registerRunWalkAtividade(
  input: CreateRunWalkAtividadeInput,
): Promise<RegisterRunWalkAtividadeResult> {
  return vdRequest<RegisterRunWalkAtividadeResult>({
    method: 'POST',
    path: '/vd/run-walk/atividades',
    body: input,
    credentials: 'include',
  })
}

export type PatchRunWalkAtividadeCheckinInput =
  | { checkIn: RunWalkActivityCheckIn }
  | { checkInSkipped: true }

export type PatchRunWalkAtividadeCheckinResult = {
  activity: RunWalkAtividadeDto
}

export async function patchRunWalkAtividadeCheckin(
  atividadeId: string,
  input: PatchRunWalkAtividadeCheckinInput,
): Promise<PatchRunWalkAtividadeCheckinResult> {
  return vdRequest<PatchRunWalkAtividadeCheckinResult>({
    method: 'PATCH',
    path: `/vd/run-walk/atividades/${atividadeId}/checkin`,
    body: input,
    credentials: 'include',
  })
}

export async function deleteRunWalkAtividade(id: string): Promise<void> {
  await vdRequest<void>({
    method: 'DELETE',
    path: `/vd/run-walk/atividades/${id}`,
    credentials: 'include',
  })
}

export type WeeklyGoalTargetsDto = {
  targetActivities: number
  targetActiveMinutes: number
  targetMovementDays: number
}

export type WeeklyGoalStatsDto = {
  completedActivities: number
  targetActivities: number
  activeMinutes: number
  targetActiveMinutes: number
  movementDays: number
  targetMovementDays: number
}

export type WeeklyCalendarActivityDto = {
  type: 'walk' | 'run' | 'run-walk' | 'strength' | 'mobility' | 'rest' | 'free'
  label: string
  completed?: boolean
}

export type WeeklyCalendarDayDto = {
  dateIso: string
  dayLabel: string
  weekdayShort: string
  dateShort: string
  isToday: boolean
  isFuture: boolean
  activeMinutes: number
  activities: WeeklyCalendarActivityDto[]
}

export type RunWalkMetasSemanaisDto = {
  weekStartDate: string
  targets: WeeklyGoalTargetsDto | null
  createdAt: string | null
  updatedAt: string | null
}

export type RunWalkMetasSemanaisProgressoDto = {
  weekStartDate: string
  weeklyGoal: WeeklyGoalStatsDto
  weeklyCalendar: WeeklyCalendarDayDto[]
  dailyExtraMinutes: Record<string, number>
}

export async function getRunWalkMetasSemanais(): Promise<RunWalkMetasSemanaisDto> {
  return vdRequest<RunWalkMetasSemanaisDto>({
    method: 'GET',
    path: '/vd/run-walk/metas-semanais',
    credentials: 'include',
  })
}

export async function putRunWalkMetasSemanais(
  targets: WeeklyGoalTargetsDto,
): Promise<RunWalkMetasSemanaisDto> {
  return vdRequest<RunWalkMetasSemanaisDto>({
    method: 'PUT',
    path: '/vd/run-walk/metas-semanais',
    body: targets,
    credentials: 'include',
  })
}

export async function getRunWalkMetasSemanaisProgresso(): Promise<RunWalkMetasSemanaisProgressoDto> {
  return vdRequest<RunWalkMetasSemanaisProgressoDto>({
    method: 'GET',
    path: '/vd/run-walk/metas-semanais/progresso',
    credentials: 'include',
  })
}

export type DispositionLevelDto = 'good' | 'moderate' | 'low' | 'rest'

export type DispositionFactorDto = {
  id: string
  label: string
  value: string
  considered: boolean
}

export type DispositionStateDto = {
  level: DispositionLevelDto
  message: string
  factors: DispositionFactorDto[]
}

export type RunWalkDisposicaoDto = DispositionStateDto & {
  checkinCompletedToday: boolean
}

export type DispositionMoodDto =
  | 'great'
  | 'good'
  | 'tired'
  | 'very-tired'
  | 'discomfort'

export type CreateRunWalkDisposicaoCheckinInput = {
  mood: DispositionMoodDto
  sleptWell?: boolean
  hasPain?: boolean
  lowEnergy?: boolean
  preferLighter?: boolean
  preferWalkOverRun?: boolean
}

export type RunWalkDisposicaoCheckinDto = {
  checkinDate: string
  mood: DispositionMoodDto
  sleptWell: boolean | null
  hasPain: boolean | null
  lowEnergy: boolean | null
  preferLighter: boolean | null
  preferWalkOverRun: boolean | null
  recommendation: string
  recommendationLabel: string
  createdAt: string
  updatedAt: string
}

export type RunWalkDisposicaoCheckinResultDto = {
  checkin: RunWalkDisposicaoCheckinDto
  disposition: RunWalkDisposicaoDto
}

export async function getRunWalkDisposicao(): Promise<RunWalkDisposicaoDto> {
  return vdRequest<RunWalkDisposicaoDto>({
    method: 'GET',
    path: '/vd/run-walk/disposicao',
    credentials: 'include',
  })
}

export async function postRunWalkDisposicaoCheckin(
  input: CreateRunWalkDisposicaoCheckinInput,
): Promise<RunWalkDisposicaoCheckinResultDto> {
  return vdRequest<RunWalkDisposicaoCheckinResultDto>({
    method: 'POST',
    path: '/vd/run-walk/disposicao/checkin',
    body: input,
    credentials: 'include',
  })
}

export type TodayActivityStepDto = {
  label: string
}

export type TodayActivityDto = {
  id: string
  title: string
  type: 'walk' | 'run-walk' | 'run'
  durationMinutes: number
  intensity: 'light' | 'comfortable' | 'moderate'
  intensityLabel: string
  goal: string
  structure: TodayActivityStepDto[]
  estimatedDistanceKm: number
  recommendedPace: string
  terrain: string
  audioGuidance: boolean
  warmup: string
  cooldown: string
  importantCautions: string[]
}

export type TodayActivityPresetDto = {
  id:
    | 'quick-activity'
    | 'light-walk'
    | 'active-walk'
    | 'recovery-walk'
    | 'beginner-run-walk'
    | 'easy-run'
  title: string
  subtitle: string
  level: 'simple' | 'moderate' | 'advanced'
  activity: TodayActivityDto
}

export type RunWalkPlanoHojeDto = {
  activity: TodayActivityDto | null
  presets: TodayActivityPresetDto[]
  hasTodayActivity: boolean
  selectedActivityId: string | null
  selectedPresetId: TodayActivityPresetDto['id'] | null
}

export type PutRunWalkPlanoHojeInput = {
  presetId?: TodayActivityPresetDto['id']
  activity?: Partial<TodayActivityDto>
}

export type RunWalkPlanoAcaoResultDto = RunWalkPlanoHojeDto & {
  notice: string | null
}

export type RunWalkPlanoMenuAction =
  | 'later'
  | 'reschedule'
  | 'tomorrow'
  | 'swap-walk'
  | 'reduce-duration'
  | 'reduce-intensity'
  | 'free-activity'
  | 'report-tired'
  | 'report-discomfort'
  | 'skip'
  | 'remove-today'

export async function getRunWalkPlanoHoje(): Promise<RunWalkPlanoHojeDto> {
  return vdRequest<RunWalkPlanoHojeDto>({
    method: 'GET',
    path: '/vd/run-walk/plano/hoje',
    credentials: 'include',
  })
}

export async function putRunWalkPlanoHoje(
  input: PutRunWalkPlanoHojeInput,
): Promise<RunWalkPlanoHojeDto> {
  return vdRequest<RunWalkPlanoHojeDto>({
    method: 'PUT',
    path: '/vd/run-walk/plano/hoje',
    body: input,
    credentials: 'include',
  })
}

export async function postRunWalkPlanoHojeAcao(input: {
  action: RunWalkPlanoMenuAction
}): Promise<RunWalkPlanoAcaoResultDto> {
  return vdRequest<RunWalkPlanoAcaoResultDto>({
    method: 'POST',
    path: '/vd/run-walk/plano/hoje/acoes',
    body: input,
    credentials: 'include',
  })
}

export type TrustedContactDto = {
  id: string
  clientContactId: string
  name: string
  phone: string
  liveShareEnabled: boolean
  isActiveSos: boolean
}

export type TrustedContactsListDto = {
  contacts: TrustedContactDto[]
  activeSosContactId: string | null
}

export type CreateTrustedContactInput = {
  clientContactId: string
  name: string
  phone: string
  liveShareEnabled?: boolean
  isActiveSos?: boolean
}

export type UpdateTrustedContactInput = {
  name?: string
  phone?: string
  liveShareEnabled?: boolean
  isActiveSos?: boolean
}

export async function getRunWalkContatosConfianca(): Promise<TrustedContactsListDto> {
  return vdRequest<TrustedContactsListDto>({
    method: 'GET',
    path: '/vd/run-walk/contatos-confianca',
    credentials: 'include',
  })
}

export async function createRunWalkContatoConfianca(
  input: CreateTrustedContactInput,
): Promise<TrustedContactsListDto> {
  return vdRequest<TrustedContactsListDto>({
    method: 'POST',
    path: '/vd/run-walk/contatos-confianca',
    body: input,
    credentials: 'include',
  })
}

export async function updateRunWalkContatoConfianca(
  id: string,
  input: UpdateTrustedContactInput,
): Promise<TrustedContactsListDto> {
  return vdRequest<TrustedContactsListDto>({
    method: 'PUT',
    path: `/vd/run-walk/contatos-confianca/${id}`,
    body: input,
    credentials: 'include',
  })
}

export async function deleteRunWalkContatoConfianca(id: string): Promise<TrustedContactsListDto> {
  return vdRequest<TrustedContactsListDto>({
    method: 'DELETE',
    path: `/vd/run-walk/contatos-confianca/${id}`,
    credentials: 'include',
  })
}

export async function activateRunWalkContatoConfiancaSos(
  id: string,
): Promise<TrustedContactDto> {
  return vdRequest<TrustedContactDto>({
    method: 'PATCH',
    path: `/vd/run-walk/contatos-confianca/${id}/ativar-sos`,
    credentials: 'include',
  })
}

export type RunningRouteLocalDto = {
  id: string
  name: string
  description: string
  type: 'park' | 'track' | 'waterfront' | 'trail' | 'plaza' | 'other'
  latitude: number
  longitude: number
  addressLabel: string | null
  locationSource: 'gps' | 'address'
  coverPhotoUrl: string | null
  submittedByCpf: string | null
  submittedByName: string | null
  recommendCount: number
  notRecommendCount: number
  distanceKm: number
  createdAt: string
}

export type RunningRouteLocaisListDto = {
  spots: RunningRouteLocalDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type ListRunWalkLocaisQuery = {
  latitude: number
  longitude: number
  radiusKm?: number
  page?: number
  pageSize?: number
}

export type CreateRunWalkLocalInput = {
  name: string
  description?: string
  type: RunningRouteLocalDto['type']
  latitude: number
  longitude: number
  addressLabel: string
  locationSource: RunningRouteLocalDto['locationSource']
  coverPhotoStoragePath?: string
  coverPhotoUrl?: string
  submittedByName?: string
}

export type RunWalkLocalCoverUploadUrlDto = {
  signedUrl: string
  storagePath: string
  token: string
  coverPhotoReference: string
}

export async function listRunWalkLocais(
  query: ListRunWalkLocaisQuery,
): Promise<RunningRouteLocaisListDto> {
  return vdRequest<RunningRouteLocaisListDto>({
    method: 'GET',
    path: '/vd/run-walk/locais',
    query: {
      latitude: String(query.latitude),
      longitude: String(query.longitude),
      radiusKm: query.radiusKm != null ? String(query.radiusKm) : undefined,
      page: query.page != null ? String(query.page) : undefined,
      pageSize: query.pageSize != null ? String(query.pageSize) : undefined,
    },
    credentials: 'include',
  })
}

export async function createRunWalkLocalCoverUploadUrl(): Promise<RunWalkLocalCoverUploadUrlDto> {
  return vdRequest<RunWalkLocalCoverUploadUrlDto>({
    method: 'POST',
    path: '/vd/run-walk/locais/capa-upload-url',
    credentials: 'include',
  })
}

export async function createRunWalkLocal(
  input: CreateRunWalkLocalInput,
): Promise<RunningRouteLocalDto> {
  return vdRequest<RunningRouteLocalDto>({
    method: 'POST',
    path: '/vd/run-walk/locais',
    body: input,
    credentials: 'include',
  })
}

export type RunningRouteSpotCommentDto = {
  id: string
  authorName: string
  text: string
  createdAt: string
}

export type RunningRouteLocalVotoResultDto = {
  userVote: 'recommend' | 'not-recommend' | null
  recommendCount: number
  notRecommendCount: number
}

export type RunningRouteLocalComentariosListDto = RunningRouteLocalVotoResultDto & {
  comments: RunningRouteSpotCommentDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export async function listRunWalkLocalComentarios(
  spotId: string,
  query?: { page?: number; pageSize?: number },
): Promise<RunningRouteLocalComentariosListDto> {
  return vdRequest<RunningRouteLocalComentariosListDto>({
    method: 'GET',
    path: `/vd/run-walk/locais/${spotId}/comentarios`,
    query: {
      page: query?.page != null ? String(query.page) : undefined,
      pageSize: query?.pageSize != null ? String(query.pageSize) : undefined,
    },
    credentials: 'include',
  })
}

export async function postRunWalkLocalVoto(
  spotId: string,
  vote: 'recommend' | 'not-recommend' | null,
): Promise<RunningRouteLocalVotoResultDto> {
  return vdRequest<RunningRouteLocalVotoResultDto>({
    method: 'POST',
    path: `/vd/run-walk/locais/${spotId}/voto`,
    body: { vote },
    credentials: 'include',
  })
}

export async function createRunWalkLocalComentario(
  spotId: string,
  input: { text: string; authorName?: string },
): Promise<RunningRouteSpotCommentDto> {
  return vdRequest<RunningRouteSpotCommentDto>({
    method: 'POST',
    path: `/vd/run-walk/locais/${spotId}/comentarios`,
    body: input,
    credentials: 'include',
  })
}

export type RunWalkIntegracaoHeartRateDto = {
  available: boolean
  bpm: number | null
  recordedAt: string | null
  source: 'integracao' | 'manual' | null
  sourceLabel?: string
  context?: 'resting' | 'workout' | 'sleep' | 'manual'
  stale: boolean
}

export type RunWalkIntegracaoStepsDto = {
  available: boolean
  todayTotal: number | null
  sessionDelta: number | null
  recordedAt: string | null
  sourceLabel?: string
}

export type RunWalkIntegracoesLeiturasTempoRealDto = {
  integrationActive: boolean
  integrations: Array<{
    integrationId: string
    status: 'connected' | 'disconnected'
    permissions: string[]
    connectedAt: string | null
    lastSyncedAt?: string
    connectedDeviceName?: string
  }>
  heartRate: RunWalkIntegracaoHeartRateDto
  steps: RunWalkIntegracaoStepsDto
  fetchedAt: string
  pollIntervalMs: number
  limitations: string[]
}

export async function getRunWalkIntegracoesLeiturasTempoReal(query?: {
  sessionStartedAt?: string
  maxAgeSeconds?: number
}): Promise<RunWalkIntegracoesLeiturasTempoRealDto> {
  return vdRequest<RunWalkIntegracoesLeiturasTempoRealDto>({
    method: 'GET',
    path: '/vd/run-walk/integracoes/leituras-tempo-real',
    query: {
      sessionStartedAt: query?.sessionStartedAt,
      maxAgeSeconds:
        query?.maxAgeSeconds != null ? String(query.maxAgeSeconds) : undefined,
    },
    credentials: 'include',
  })
}

export type RunWalkPreparacaoRascunhoDto = {
  modality: ActivityModality
  activityName: string
  intensity: string
  durationMinutes: number
  audioConfigured: boolean
  updatedAt: string
  expiresAt: string
}

export type RunWalkPreparacaoRascunhoResultDto = {
  draft: RunWalkPreparacaoRascunhoDto | null
}

export async function getRunWalkPreparacaoRascunho(): Promise<RunWalkPreparacaoRascunhoResultDto> {
  return vdRequest<RunWalkPreparacaoRascunhoResultDto>({
    method: 'GET',
    path: '/vd/run-walk/preparacao/rascunho',
    credentials: 'include',
  })
}

export async function putRunWalkPreparacaoRascunho(
  input: Omit<RunWalkPreparacaoRascunhoDto, 'updatedAt' | 'expiresAt'>,
): Promise<RunWalkPreparacaoRascunhoResultDto> {
  return vdRequest<RunWalkPreparacaoRascunhoResultDto>({
    method: 'PUT',
    path: '/vd/run-walk/preparacao/rascunho',
    body: input,
    credentials: 'include',
  })
}

export async function deleteRunWalkPreparacaoRascunho(): Promise<void> {
  await vdRequest<void>({
    method: 'DELETE',
    path: '/vd/run-walk/preparacao/rascunho',
    credentials: 'include',
  })
}
