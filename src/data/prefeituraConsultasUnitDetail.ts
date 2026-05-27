import {
  prefeituraConsultasDailySeries,
  prefeituraConsultasSpecialties,
  type PrefeituraConsultasDailyPoint,
  type PrefeituraConsultasUnitRow,
} from './prefeituraConsultasMock'
import { prefeituraRedeUnits } from './prefeituraRedeMock'
import { prefeituraSpecialtyStats } from './prefeituraSpecialtyStats'
import { formatDatePtBr } from '../utils/calendar'

export type PrefeituraConsultasUnitGenderStat = {
  key: 'F' | 'M' | 'NI'
  label: string
  count: number
  percent: number
  color: string
}

export type PrefeituraConsultasUnitSpecialtySlice = {
  key: string
  label: string
  count: number
  percent: number
  color: string
}

export type PrefeituraConsultasUnitDetail = {
  unit: PrefeituraConsultasUnitRow
  periodLabel: string
  periodStart: string
  periodEnd: string
  cnes: string | null
  responsibleName: string | null
  networkAvgVolume: number
  volumeVsNetworkPercent: number
  previousPeriod: {
    volumeDeltaPercent: number
    completionDeltaPp: number
    cancelledDeltaPp: number
    durationDeltaMin: number
  }
  dailySeries: PrefeituraConsultasDailyPoint[]
  specialties: PrefeituraConsultasUnitSpecialtySlice[]
  genderStats: PrefeituraConsultasUnitGenderStat[]
}

function seedFromId(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function formatPeriodLabel(start: string, end: string) {
  const startLabel = formatDatePtBr(start)
  const endLabel = formatDatePtBr(end)
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  return 'Período selecionado'
}

function buildDailySeriesForUnit(unit: PrefeituraConsultasUnitRow): PrefeituraConsultasDailyPoint[] {
  const networkTotal = prefeituraConsultasDailySeries.reduce((sum, point) => sum + point.value, 0)
  const share = unit.volumeTotal / Math.max(networkTotal, 1)
  const jitter = 0.88 + (seedFromId(unit.id) % 7) * 0.04

  return prefeituraConsultasDailySeries.map((point) => ({
    ...point,
    value: Math.max(4, Math.round(point.value * share * jitter)),
  }))
}

function buildGenderStats(unit: PrefeituraConsultasUnitRow): PrefeituraConsultasUnitGenderStat[] {
  const seed = seedFromId(unit.id)
  const femaleBase = 47 + (seed % 8)
  const maleBase = 100 - femaleBase - (4 + (seed % 3))

  const femaleCount = Math.round((unit.volumeTotal * femaleBase) / 100)
  const maleCount = Math.round((unit.volumeTotal * maleBase) / 100)
  const niCount = Math.max(0, unit.volumeTotal - femaleCount - maleCount)
  const total = Math.max(1, unit.volumeTotal)

  return [
    { key: 'F', label: 'Feminino', count: femaleCount, color: '#ec4899' },
    { key: 'M', label: 'Masculino', count: maleCount, color: '#3b82f6' },
    { key: 'NI', label: 'Não informado', count: niCount, color: '#94a3b8' },
  ].map((item) => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
}

function buildSpecialtySlices(unit: PrefeituraConsultasUnitRow): PrefeituraConsultasUnitSpecialtySlice[] {
  const pool =
    prefeituraSpecialtyStats.length > 0
      ? [...prefeituraSpecialtyStats].sort((a, b) => b.count - a.count).slice(0, 6)
      : prefeituraConsultasSpecialties.map((item) => ({
          key: item.key,
          label: item.label,
          count: item.sharePercent,
          available: true,
          color: item.color,
        }))

  const weightTotal = pool.reduce((sum, item) => sum + item.count, 0) || 1
  let remaining = unit.volumeTotal

  const slices = pool.map((item, index) => {
    const count =
      index === pool.length - 1
        ? remaining
        : Math.round((unit.volumeTotal * item.count) / weightTotal)
    remaining -= count

    return {
      key: item.key,
      label: item.label,
      count: Math.max(0, count),
      percent: 0,
      color: item.color,
    }
  })

  const total = Math.max(1, unit.volumeTotal)
  return slices
    .map((slice) => ({ ...slice, percent: Math.round((slice.count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export function buildPrefeituraConsultasUnitDetail(
  unit: PrefeituraConsultasUnitRow,
  periodStart: string,
  periodEnd: string,
  allUnits: PrefeituraConsultasUnitRow[],
): PrefeituraConsultasUnitDetail {
  const networkAvgVolume =
    allUnits.reduce((sum, row) => sum + row.volumeTotal, 0) / Math.max(allUnits.length, 1)
  const volumeVsNetworkPercent =
    networkAvgVolume > 0
      ? Number((((unit.volumeTotal - networkAvgVolume) / networkAvgVolume) * 100).toFixed(1))
      : 0

  const seed = seedFromId(unit.id)
  const redeUnit = prefeituraRedeUnits.find((row) => row.name === unit.name)

  return {
    unit,
    periodLabel: formatPeriodLabel(periodStart, periodEnd),
    periodStart,
    periodEnd,
    cnes: redeUnit?.cnes ?? null,
    responsibleName: redeUnit?.responsibleName ?? null,
    networkAvgVolume: Math.round(networkAvgVolume),
    volumeVsNetworkPercent,
    previousPeriod: {
      volumeDeltaPercent: 6 + (seed % 14),
      completionDeltaPp: Number((1.2 + (seed % 5) * 0.3).toFixed(1)),
      cancelledDeltaPp: Number((-0.8 + (seed % 4) * 0.2).toFixed(1)),
      durationDeltaMin: -2 + (seed % 3),
    },
    dailySeries: buildDailySeriesForUnit(unit),
    specialties: buildSpecialtySlices(unit),
    genderStats: buildGenderStats(unit),
  }
}
