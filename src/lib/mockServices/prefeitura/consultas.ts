import type {
  PrefeituraConsultasDailyPoint,
  PrefeituraConsultasKpi,
  PrefeituraConsultasSpecialtyItem,
  PrefeituraConsultasUnitRow,
} from '../../../data/prefeituraConsultasMock'
import {
  prefeituraConsultasDailySeries,
  prefeituraConsultasKpiCards,
  prefeituraConsultasPeriodTotal,
  prefeituraConsultasRegionFilterOptions,
  prefeituraConsultasSpecialties,
  prefeituraConsultasUnitFilterOptions,
  prefeituraConsultasUnitRows,
} from '../../../data/prefeituraConsultasMock'
import { mockDelay } from '../delay'

export class PrefeituraConsultasApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraConsultasApiError'
    this.status = status
    this.code = code
  }
}

export type PrefeituraConsultasOverviewApi = {
  kpis: PrefeituraConsultasKpi[]
  units: PrefeituraConsultasUnitRow[]
  dailySeries: PrefeituraConsultasDailyPoint[]
  periodTotal: number
  specialties: PrefeituraConsultasSpecialtyItem[]
  filterOptions: {
    units: Array<{ value: string; label: string }>
    regions: Array<{ value: string; label: string }>
  }
}

export type PrefeituraConsultasUnitDetailApi = {
  unitId: string
  unitName: string
  volumeTotal: number
  completed: number
  cancelled: number
  avgDurationMin: number
  genderStats: Array<{ label: string; count: number; percent: number }>
  specialtySlices: Array<{ label: string; count: number; percent: number }>
}

function filterUnits(params: {
  unidadeUbtId?: string
  regionKey?: string
}) {
  let units = [...prefeituraConsultasUnitRows]
  if (params.regionKey && params.regionKey !== 'todas') {
    units = units.filter((unit) => unit.regionKey === params.regionKey)
  }
  if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
    units = units.filter((unit) => unit.id === params.unidadeUbtId)
  }
  return units
}

export function isPrefeituraConsultasApiError(error: unknown): error is PrefeituraConsultasApiError {
  return error instanceof PrefeituraConsultasApiError
}

export async function fetchPrefeituraConsultasOverview(
  _accessToken: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
) {
  void _accessToken
  void params.periodStart
  void params.periodEnd
  const units = filterUnits(params)
  const overview: PrefeituraConsultasOverviewApi = {
    kpis: structuredClone(prefeituraConsultasKpiCards),
    units,
    dailySeries: structuredClone(prefeituraConsultasDailySeries),
    periodTotal: prefeituraConsultasPeriodTotal,
    specialties: structuredClone(prefeituraConsultasSpecialties),
    filterOptions: {
      units: prefeituraConsultasUnitFilterOptions.map((item) => ({ ...item })),
      regions: prefeituraConsultasRegionFilterOptions.map((item) => ({ ...item })),
    },
  }
  return mockDelay(overview, 70)
}

export async function fetchPrefeituraConsultasUnitDetail(
  _accessToken: string,
  unitId: string,
  _periodStart: string,
  _periodEnd: string,
) {
  void _accessToken
  void _periodStart
  void _periodEnd
  const unit = prefeituraConsultasUnitRows.find((item) => item.id === unitId)
  if (!unit) {
    throw new PrefeituraConsultasApiError('Unidade não encontrada.', 404, 'UNIT_NOT_FOUND')
  }

  const detail: PrefeituraConsultasUnitDetailApi = {
    unitId: unit.id,
    unitName: unit.name,
    volumeTotal: unit.volumeTotal,
    completed: unit.completed,
    cancelled: unit.cancelled,
    avgDurationMin: unit.avgDurationMin,
    genderStats: [
      { label: 'Feminino', count: Math.round(unit.completed * 0.58), percent: 58 },
      { label: 'Masculino', count: Math.round(unit.completed * 0.4), percent: 40 },
      { label: 'Não informado', count: Math.round(unit.completed * 0.02), percent: 2 },
    ],
    specialtySlices: prefeituraConsultasSpecialties.slice(0, 5).map((item) => ({
      label: item.label,
      count: Math.round((unit.completed * item.sharePercent) / 100),
      percent: item.sharePercent,
    })),
  }
  return mockDelay(detail, 70)
}
