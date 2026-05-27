import type { PrefeituraUbsRow } from './prefeituraDashboardMock'
import { prefeituraHourlyConsultations } from './prefeituraDashboardMock'
import { prefeituraSpecialtyStats } from './prefeituraSpecialtyStats'

export type PrefeituraUbsGenderStat = {
  key: 'F' | 'M' | 'NI'
  label: string
  count: number
  percent: number
  color: string
}

export type PrefeituraUbsSpecialtySlice = {
  key: string
  label: string
  count: number
  percent: number
  color: string
}

export type PrefeituraUbsQueueSlice = {
  label: string
  count: number
  description: string
}

export type PrefeituraUbsHourlyPoint = {
  hour: string
  value: number
}

export type PrefeituraUbsDetail = {
  unit: PrefeituraUbsRow
  operatorsOnline: number
  stationsActive: number
  consultationsCompleted: number
  consultationsInProgress: number
  cancellationsToday: number
  noShowRatePercent: number
  peakHour: string
  avgConsultationMinutes: number
  telehealthSharePercent: number
  inPersonSharePercent: number
  genderStats: PrefeituraUbsGenderStat[]
  specialties: PrefeituraUbsSpecialtySlice[]
  hourlyToday: PrefeituraUbsHourlyPoint[]
  queueBreakdown: PrefeituraUbsQueueSlice[]
}

function seedFromId(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function scaleHourlyForUnit(unit: PrefeituraUbsRow): PrefeituraUbsHourlyPoint[] {
  const share =
    unit.consultationsToday /
    Math.max(1, prefeituraHourlyConsultations.reduce((s, p) => s + p.value, 0) / 7)

  return prefeituraHourlyConsultations.map((point) => ({
    hour: point.hour,
    value: Math.max(0, Math.round(point.value * share * (0.85 + (seedFromId(unit.id) % 5) * 0.05))),
  }))
}

function buildGenderStats(unit: PrefeituraUbsRow): PrefeituraUbsGenderStat[] {
  const seed = seedFromId(unit.id)
  const femaleBase = 48 + (seed % 9)
  const maleBase = 100 - femaleBase - (3 + (seed % 4))
  const niBase = 100 - femaleBase - maleBase

  const femaleCount = Math.round((unit.consultationsToday * femaleBase) / 100)
  const maleCount = Math.round((unit.consultationsToday * maleBase) / 100)
  const niCount = Math.max(0, unit.consultationsToday - femaleCount - maleCount)

  const items = [
    { key: 'F' as const, label: 'Feminino', count: femaleCount, color: '#ec4899' },
    { key: 'M' as const, label: 'Masculino', count: maleCount, color: '#3b82f6' },
    { key: 'NI' as const, label: 'Não informado', count: niCount, color: '#94a3b8' },
  ]

  const total = Math.max(1, unit.consultationsToday)

  return items.map((item) => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
}

function buildSpecialtySlices(unit: PrefeituraUbsRow): PrefeituraUbsSpecialtySlice[] {
  const pool = [...prefeituraSpecialtyStats].sort((a, b) => b.count - a.count)
  const networkTotal = pool.reduce((sum, item) => sum + item.count, 0) || 1
  let remaining = unit.consultationsToday

  const slices = pool.map((item, index) => {
    const count =
      index === pool.length - 1
        ? remaining
        : Math.round((unit.consultationsToday * item.count) / networkTotal)
    remaining -= count

    return {
      key: item.key,
      label: item.label,
      count: Math.max(0, count),
      percent: 0,
      color: item.color,
    }
  })

  const total = Math.max(1, unit.consultationsToday)

  return slices
    .map((slice) => ({ ...slice, percent: Math.round((slice.count / total) * 100) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
}

function buildQueueBreakdown(unit: PrefeituraUbsRow): PrefeituraUbsQueueSlice[] {
  const returnVisit = Math.round(unit.queueNow * 0.28)
  const scheduled = Math.max(0, unit.queueNow - returnVisit)

  return [
    {
      label: 'Retorno programado',
      count: returnVisit,
      description: 'Reconsultas e retornos de protocolo.',
    },
    {
      label: 'Demanda espontânea',
      count: scheduled,
      description: 'Novos atendimentos do dia na unidade.',
    },
  ]
}

export function buildPrefeituraUbsDetail(unit: PrefeituraUbsRow): PrefeituraUbsDetail {
  const seed = seedFromId(unit.id)
  const hourlyToday = scaleHourlyForUnit(unit)
  const peak = [...hourlyToday].sort((a, b) => b.value - a.value)[0]

  const completed = Math.round(unit.consultationsToday * (0.62 + (seed % 8) * 0.02))
  const inProgress = Math.min(unit.queueNow, Math.round(unit.consultationsToday * 0.12))
  const cancellations = Math.max(1, Math.round(unit.absencesToday * 0.35))
  const noShowRate = Math.min(
    28,
    Math.round((unit.absencesToday / Math.max(1, unit.consultationsToday)) * 100),
  )

  return {
    unit,
    operatorsOnline: Math.max(1, Math.round(2 + (unit.consultationsToday / 45) + (seed % 3))),
    stationsActive: unit.typeKey === 'tipo2' ? 3 : 2,
    consultationsCompleted: completed,
    consultationsInProgress: inProgress,
    cancellationsToday: cancellations,
    noShowRatePercent: noShowRate,
    peakHour: peak?.hour ?? '—',
    avgConsultationMinutes: 14 + (seed % 9),
    telehealthSharePercent: 100,
    inPersonSharePercent: 0,
    genderStats: buildGenderStats(unit),
    specialties: buildSpecialtySlices(unit),
    hourlyToday,
    queueBreakdown: buildQueueBreakdown(unit),
  }
}
