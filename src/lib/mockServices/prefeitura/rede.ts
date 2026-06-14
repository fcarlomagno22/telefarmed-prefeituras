import { Building2, Monitor, Users, Wifi } from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import type { DonutSlice } from '../../../components/credenciais/CredentialDonutChart'
import { prefeituraRedeStatusBadgeConfig } from '../../../components/prefeitura/rede/prefeituraRedeStatusBadge'
import type { PrefeituraRedeUnit, PrefeituraRedeUnitStatus } from '../../../data/prefeituraRedeMock'
import {
  prefeituraRedeRegionFilterOptions,
  prefeituraRedeRegionSlices,
  prefeituraRedeStationStatusSlices,
  prefeituraRedeStatusFilterOptions,
  prefeituraRedeUnits,
} from '../../../data/prefeituraRedeMock'
import { prefeituraRedeUbtOperators } from '../../../data/prefeituraRedeBroadcastMock'
import type {
  PrefeituraRedeUnitCadastral,
  PrefeituraRedeUnitCadastralProfile,
} from '../../../data/prefeituraRedeUnitDetail'
import {
  buildCadastralProfileFromNewUbtForm,
  buildPrefeituraRedeUnitCadastral,
  buildPrefeituraRedeUnitFullDetail,
} from '../../../data/prefeituraRedeUnitDetail'
import type { PrefeituraUbsDetail } from '../../../data/prefeituraUbsDetails'
import type { PrefeituraUbsRow } from '../../../types/prefeituraDashboard'
import type { PrefeituraRedeUbtOperator } from '../../../data/prefeituraRedeBroadcastMock'
import { mockDelay } from '../delay'

export class PrefeituraRedeApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraRedeApiError'
    this.status = status
    this.code = code
  }
}

export type PrefeituraRedeUnitApi = {
  id: string
  name: string
  address: string
  cnes: string
  region: string
  regionKey: string
  responsibleName: string
  responsiblePhone: string
  stationsTotal: number
  stationsOnline: number
  status: PrefeituraRedeUnitStatus
  maintenanceTerminalIndexes?: number[]
}

export type PrefeituraRedeOverviewApi = {
  kpis: Array<{
    key: string
    label: string
    value: string
    suffix: string
    topBar: string
  }>
  regionSlices: DonutSlice[]
  stationStatusSlices: DonutSlice[]
  filterOptions: {
    regions: Array<{ value: string; label: string }>
    statuses: Array<{ value: string; label: string }>
  }
}

export type PrefeituraRedeUnitDetailApi = {
  unit: PrefeituraRedeUnitApi
  cadastral: PrefeituraRedeUnitCadastralProfile & {
    address: PrefeituraRedeUnitCadastral['address']
  }
  operators: PrefeituraRedeUbtOperator[]
  metrics: {
    operatorsOnline: number
    stationsActive: number
    consultationsCompleted: number
    consultationsInProgress: number
    cancellationsToday: number
    avgConsultationMinutes: number
    queueNow: number
    consultationsToday: number
  }
}

export type PrefeituraRedeBroadcastCatalogApi = {
  units: PrefeituraRedeUnitApi[]
  operators: PrefeituraRedeUbtOperator[]
  regionOptions: Array<{ value: string; label: string }>
}

export type PrefeituraRedeSettingsApi = {
  limitDailyCapacity: boolean
  dailyCapacity: number
  limitPerUnit: boolean
  unitDailyLimits: Record<string, string>
  unitSpecialties: Record<string, string[]>
  allowAvulso: boolean
  packageConsultationsTotal: number | null
}

export type CreatePrefeituraRedeUnitInput = {
  name: string
  cnes?: string
  unitType: 'fixa' | 'movel'
  status: PrefeituraRedeUnitStatus
  regionKey: string
  regionLabel: string
  phone?: string
  dailyCapacity?: number
  specialties?: string[]
  notes?: string
  stationsTotal: number
  address?: {
    cep?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
  }
}

export type UpdatePrefeituraRedeUnitInput = Partial<CreatePrefeituraRedeUnitInput> & {
  maintenanceTerminalIndexes?: number[]
  responsible?: {
    name: string
    email?: string
    cpf?: string
  }
}

export type NotifyPrefeituraRedeUnitInput = {
  message: string
  recipientScope?: 'ubt' | 'responsible' | 'operators'
  priority?: 'normal' | 'important'
}

const KPI_ICONS: Record<string, KpiStatCardItem['icon']> = {
  active_units: Building2,
  terminals: Monitor,
  daily_capacity: Users,
  availability: Wifi,
}

const KPI_STYLES: Record<
  string,
  Pick<KpiStatCardItem, 'iconGradient' | 'iconShadow' | 'iconRing'>
> = {
  active_units: {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
  },
  terminals: {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
  },
  daily_capacity: {
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
  },
  availability: {
    iconGradient: 'from-teal-500 via-cyan-500 to-sky-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(20,184,166,0.35)]',
    iconRing: 'ring-teal-100/80',
  },
}

let unitsState: PrefeituraRedeUnit[] = structuredClone(prefeituraRedeUnits)

function clone<T>(value: T): T {
  return structuredClone(value)
}

function ensureUnit(unitId: string) {
  const unit = unitsState.find((item) => item.id === unitId)
  if (!unit) {
    throw new PrefeituraRedeApiError('Unidade não encontrada.', 404, 'UNIT_NOT_FOUND')
  }
  return unit
}

function mapUnitToApi(unit: PrefeituraRedeUnit): PrefeituraRedeUnitApi {
  return { ...unit }
}

function buildDetail(unit: PrefeituraRedeUnit, profile?: PrefeituraRedeUnitCadastralProfile): PrefeituraRedeUnitDetailApi {
  const full = buildPrefeituraRedeUnitFullDetail(unit, profile)
  const cadastral = buildPrefeituraRedeUnitCadastral(unit, profile)
  const metrics = full.metrics

  return {
    unit: mapUnitToApi(unit),
    cadastral: {
      unitType: cadastral.unitType,
      responsibleEmail: cadastral.responsibleEmail,
      responsibleCpf: cadastral.responsibleCpf,
      unitLandline: cadastral.unitLandline,
      dailyCapacityLabel: cadastral.dailyCapacityLabel,
      specialtyNames: cadastral.specialtyNames,
      address: cadastral.address,
      notes: cadastral.notes,
      credentialsConfigured: cadastral.credentialsConfigured,
    },
    operators: cadastral.operators,
    metrics: {
      operatorsOnline: metrics.operatorsOnline,
      stationsActive: metrics.stationsActive,
      consultationsCompleted: metrics.consultationsCompleted,
      consultationsInProgress: metrics.consultationsInProgress,
      cancellationsToday: metrics.cancellationsToday,
      avgConsultationMinutes: metrics.avgConsultationMinutes,
      queueNow: metrics.unit.queueNow,
      consultationsToday: metrics.unit.consultationsToday,
    },
  }
}

function buildOverview(): PrefeituraRedeOverviewApi {
  const activeUnits = unitsState.filter((unit) => unit.status === 'ativa')
  const terminalsOnline = unitsState.reduce((sum, unit) => sum + unit.stationsOnline, 0)
  const terminalsTotal = unitsState.reduce((sum, unit) => sum + unit.stationsTotal, 0)
  const dailyCapacity = activeUnits.reduce((sum, unit) => sum + unit.stationsTotal * 18, 0)

  return {
    kpis: [
      {
        key: 'active_units',
        label: 'Unidades ativas',
        value: String(activeUnits.length),
        suffix: `de ${unitsState.length} unidades`,
        topBar: 'from-emerald-400 to-green-500',
      },
      {
        key: 'terminals',
        label: 'Terminais de atendimento',
        value: String(terminalsOnline),
        suffix: 'computadores online',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        key: 'daily_capacity',
        label: 'Capacidade diária',
        value: String(dailyCapacity),
        suffix: 'atendimentos estimados',
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        key: 'availability',
        label: 'Taxa de disponibilidade',
        value: `${Math.round((terminalsOnline / Math.max(1, terminalsTotal)) * 100)}%`,
        suffix: 'dos terminais online',
        topBar: 'from-teal-400 to-cyan-500',
      },
    ],
    regionSlices: clone(prefeituraRedeRegionSlices),
    stationStatusSlices: clone(prefeituraRedeStationStatusSlices),
    filterOptions: {
      regions: prefeituraRedeRegionFilterOptions.map((item) => ({ ...item })),
      statuses: prefeituraRedeStatusFilterOptions.map((item) => ({ ...item })),
    },
  }
}

export function isPrefeituraRedeApiError(error: unknown): error is PrefeituraRedeApiError {
  return error instanceof PrefeituraRedeApiError
}

type OverviewDonutSliceInput = {
  key?: string
  label: string
  count?: number
  value?: number
  color?: string
  gradientFrom?: string
  gradientTo?: string
}

const STATION_STATUS_GRADIENTS: Record<string, { gradientFrom: string; gradientTo: string }> = {
  online: { gradientFrom: '#22c55e', gradientTo: '#10b981' },
  offline: { gradientFrom: '#ef4444', gradientTo: '#f87171' },
  manutencao: { gradientFrom: '#f97316', gradientTo: '#fb923c' },
}

function overviewSliceKey(label: string, index: number): string {
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  return normalized || `slice_${index}`
}

export function mapOverviewDonutSlices(slices: OverviewDonutSliceInput[]): DonutSlice[] {
  return slices.map((slice, index) => {
    const key = slice.key ?? overviewSliceKey(slice.label, index)
    const count = Number(slice.count ?? slice.value ?? 0)
    const gradients =
      slice.gradientFrom && slice.gradientTo
        ? { gradientFrom: slice.gradientFrom, gradientTo: slice.gradientTo }
        : STATION_STATUS_GRADIENTS[key] ?? {
            gradientFrom: slice.color ?? '#6366f1',
            gradientTo: slice.color ?? '#818cf8',
          }

    return {
      key,
      label: slice.label,
      count,
      gradientFrom: gradients.gradientFrom,
      gradientTo: gradients.gradientTo,
    }
  })
}

export function mapOverviewKpisToCards(
  kpis: PrefeituraRedeOverviewApi['kpis'],
): KpiStatCardItem[] {
  return kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    suffix: kpi.suffix,
    topBar: kpi.topBar,
    icon: KPI_ICONS[kpi.key] ?? Building2,
    iconGradient: KPI_STYLES[kpi.key]?.iconGradient ?? KPI_STYLES.active_units.iconGradient,
    iconShadow: KPI_STYLES[kpi.key]?.iconShadow ?? KPI_STYLES.active_units.iconShadow,
    iconRing: KPI_STYLES[kpi.key]?.iconRing ?? KPI_STYLES.active_units.iconRing,
  }))
}

export function mapApiUnitToRedeUnit(unit: PrefeituraRedeUnitApi): PrefeituraRedeUnit {
  return {
    ...unit,
    maintenanceTerminalIndexes: unit.maintenanceTerminalIndexes,
  }
}

function mapStatusToSla(status: PrefeituraRedeUnitStatus): PrefeituraUbsRow['sla'] {
  if (status === 'ativa') return 'normal'
  if (status === 'manutencao') return 'atencao'
  return 'critico'
}

function toDashboardRegionKey(regionKey: string): PrefeituraUbsRow['regionKey'] {
  if (
    regionKey === 'norte' ||
    regionKey === 'leste' ||
    regionKey === 'central' ||
    regionKey === 'sul' ||
    regionKey === 'centro'
  ) {
    return regionKey === 'centro' ? 'central' : regionKey
  }
  return 'central'
}

export function mapRedeDetailToUbsDetail(detail: PrefeituraRedeUnitDetailApi): PrefeituraUbsDetail {
  const { unit, metrics } = detail
  const dashboardRow: PrefeituraUbsRow = {
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: toDashboardRegionKey(unit.regionKey),
    type: detail.cadastral.unitType === 'Móvel' ? 'Móvel' : 'Tipo I',
    typeKey: detail.cadastral.unitType === 'Móvel' ? 'tipo2' : 'tipo1',
    consultationsToday: metrics.consultationsToday,
    queueNow: metrics.queueNow,
    avgWait: metrics.queueNow > 0 ? `${Math.max(5, metrics.avgConsultationMinutes)} min` : '—',
    absencesToday: metrics.cancellationsToday,
    sla: mapStatusToSla(unit.status),
    statusDot: mapStatusToSla(unit.status),
  }

  return {
    unit: dashboardRow,
    operatorsOnline: metrics.operatorsOnline,
    stationsActive: metrics.stationsActive,
    consultationsCompleted: metrics.consultationsCompleted,
    consultationsInProgress: metrics.consultationsInProgress,
    cancellationsToday: metrics.cancellationsToday,
    noShowRatePercent: 0,
    peakHour: '—',
    avgConsultationMinutes: metrics.avgConsultationMinutes,
    telehealthSharePercent: 100,
    inPersonSharePercent: 0,
    genderStats: [],
    specialties: [],
    hourlyToday: [],
    queueBreakdown: [
      {
        label: 'Fila ativa',
        count: metrics.queueNow,
        description: 'Pacientes aguardando atendimento na unidade.',
      },
    ],
  }
}

export function mapRedeDetailToCadastral(detail: PrefeituraRedeUnitDetailApi): PrefeituraRedeUnitCadastral {
  const unit = mapApiUnitToRedeUnit(detail.unit)
  return {
    unit,
    unitType: detail.cadastral.unitType,
    statusLabel: prefeituraRedeStatusBadgeConfig[unit.status].label,
    responsibleEmail: detail.cadastral.responsibleEmail,
    responsibleCpf: detail.cadastral.responsibleCpf,
    unitLandline: detail.cadastral.unitLandline,
    dailyCapacityLabel: detail.cadastral.dailyCapacityLabel,
    specialtyNames: detail.cadastral.specialtyNames,
    operators: detail.operators,
    address: detail.cadastral.address,
    notes: detail.cadastral.notes,
    credentialsConfigured: detail.cadastral.credentialsConfigured,
  }
}

export async function fetchPrefeituraRedeOverview(_accessToken: string) {
  void _accessToken
  return mockDelay(buildOverview(), 70)
}

export async function fetchPrefeituraRedeUnits(_accessToken: string) {
  void _accessToken
  return mockDelay(unitsState.map(mapUnitToApi), 60)
}

export async function fetchPrefeituraRedeUnitDetail(_accessToken: string, unitId: string) {
  void _accessToken
  return mockDelay(buildDetail(ensureUnit(unitId)), 70)
}

export async function fetchPrefeituraRedeBroadcastCatalog(_accessToken: string) {
  void _accessToken
  const catalog: PrefeituraRedeBroadcastCatalogApi = {
    units: unitsState.filter((unit) => unit.status !== 'inativa').map(mapUnitToApi),
    operators: clone(prefeituraRedeUbtOperators),
    regionOptions: prefeituraRedeRegionFilterOptions
      .filter((item) => item.value !== 'todas')
      .map((item) => ({ value: item.value, label: item.label })),
  }
  return mockDelay(catalog, 60)
}

export async function createPrefeituraRedeUnit(
  _accessToken: string,
  body: CreatePrefeituraRedeUnitInput,
) {
  void _accessToken
  const id = `rede-${Date.now()}`
  const unit: PrefeituraRedeUnit = {
    id,
    name: body.name,
    address: body.address
      ? [body.address.street, body.address.number, body.address.neighborhood, body.address.city]
          .filter(Boolean)
          .join(', ')
      : 'Endereço a confirmar',
    cnes: body.cnes ?? '0000000',
    region: body.regionLabel,
    regionKey: body.regionKey,
    responsibleName: 'Responsável pendente',
    responsiblePhone: body.phone ?? '',
    stationsTotal: body.stationsTotal,
    stationsOnline: body.status === 'ativa' ? body.stationsTotal : 0,
    status: body.status,
  }
  const profile = buildCadastralProfileFromNewUbtForm({
    name: body.name,
    cnes: body.cnes ?? '',
    unitType: body.unitType,
    status: body.status,
    regionKey: body.regionKey,
    regionLabel: body.regionLabel,
    responsibleEmail: '',
    responsibleCpf: '',
    unitLandlinePhone: body.phone ?? '',
    enableDailyCapacityLimit: Boolean(body.dailyCapacity),
    dailyCapacityPerUnit: String(body.dailyCapacity ?? ''),
    specialtyIds: new Set(body.specialties ?? []),
    notes: body.notes ?? '',
    cep: body.address?.cep ?? '',
    street: body.address?.street ?? '',
    number: body.address?.number ?? '',
    complement: body.address?.complement ?? '',
    neighborhood: body.address?.neighborhood ?? '',
    city: body.address?.city ?? 'Brasília',
    state: body.address?.state ?? 'DF',
    stationsTotal: body.stationsTotal,
  } as never)
  unitsState = [unit, ...unitsState]
  return mockDelay(buildDetail(unit, profile), 80)
}

export async function updatePrefeituraRedeUnit(
  _accessToken: string,
  unitId: string,
  body: UpdatePrefeituraRedeUnitInput,
) {
  void _accessToken
  const unit = ensureUnit(unitId)
  if (body.name) unit.name = body.name
  if (body.cnes) unit.cnes = body.cnes
  if (body.status) unit.status = body.status
  if (body.regionKey) unit.regionKey = body.regionKey
  if (body.regionLabel) unit.region = body.regionLabel
  if (body.phone) unit.responsiblePhone = body.phone
  if (body.stationsTotal != null) unit.stationsTotal = body.stationsTotal
  if (body.status === 'ativa') unit.stationsOnline = unit.stationsTotal
  if (body.status === 'inativa') unit.stationsOnline = 0
  if (body.status === 'manutencao') unit.stationsOnline = 0
  return mockDelay(buildDetail(unit), 80)
}

export async function deletePrefeituraRedeUnit(_accessToken: string, unitId: string) {
  void _accessToken
  ensureUnit(unitId)
  unitsState = unitsState.filter((item) => item.id !== unitId)
  return mockDelay(undefined, 60)
}

export async function notifyPrefeituraRedeUnit(
  _accessToken: string,
  unitId: string,
  body: NotifyPrefeituraRedeUnitInput,
) {
  void _accessToken
  ensureUnit(unitId)
  return mockDelay(
    {
      message: 'Comunicado enviado com sucesso.',
      recipientCount: 1,
      delivered: true,
    },
    80,
  )
}
