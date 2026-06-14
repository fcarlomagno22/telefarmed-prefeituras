import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import { buildFilterOptions } from '../prefeitura-rede/formatters.js'
import { spDateKey, spDateLabel } from './period.js'
import type {
  ConsultaAggregateRow,
  PrefeituraConsultasDailyPointDto,
  PrefeituraConsultasKpiDto,
  PrefeituraConsultasSpecialtyItemDto,
  PrefeituraConsultasUnitRowDto,
} from './types.js'

const SPECIALTY_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#6366f1']

const GENDER_COLORS = {
  F: '#ec4899',
  M: '#3b82f6',
  NI: '#94a3b8',
} as const

export type UnitPeriodStats = {
  total: number
  completed: number
  cancelled: number
  inProgress: number
  durationSum: number
  durationCount: number
  specialtyCounts: Map<string, { id: string; label: string; count: number }>
  genderCounts: { F: number; M: number; NI: number }
  dailyCounts: Map<string, number>
}

export type NetworkPeriodStats = {
  total: number
  completed: number
  cancelled: number
  inProgress: number
  durationSum: number
  durationCount: number
  specialtyCounts: Map<string, { id: string; label: string; count: number }>
  genderCounts: { F: number; M: number; NI: number }
  dailyCounts: Map<string, number>
  byUnit: Map<string, UnitPeriodStats>
}

export function emptyUnitStats(): UnitPeriodStats {
  return {
    total: 0,
    completed: 0,
    cancelled: 0,
    inProgress: 0,
    durationSum: 0,
    durationCount: 0,
    specialtyCounts: new Map(),
    genderCounts: { F: 0, M: 0, NI: 0 },
    dailyCounts: new Map(),
  }
}

function emptyNetworkStats(): NetworkPeriodStats {
  return {
    total: 0,
    completed: 0,
    cancelled: 0,
    inProgress: 0,
    durationSum: 0,
    durationCount: 0,
    specialtyCounts: new Map(),
    genderCounts: { F: 0, M: 0, NI: 0 },
    dailyCounts: new Map(),
    byUnit: new Map(),
  }
}

function computeDurationMinutes(row: ConsultaAggregateRow): number | null {
  if (typeof row.duracao_minutos === 'number' && row.duracao_minutos >= 0) {
    return row.duracao_minutos
  }
  if (row.status !== 'concluida') return null
  const start = row.iniciada_em ?? row.criado_em
  const end = row.finalizada_em
  if (!start || !end) return null
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null
  return Math.max(1, Math.round((endMs - startMs) / 60_000))
}

function mapSexoToGenderKey(sexo: string | null): 'F' | 'M' | 'NI' {
  const normalized = String(sexo ?? '').toLowerCase()
  if (normalized === 'feminino' || normalized === 'f') return 'F'
  if (normalized === 'masculino' || normalized === 'm') return 'M'
  return 'NI'
}

function bumpSpecialty(
  map: Map<string, { id: string; label: string; count: number }>,
  id: string,
  label: string,
) {
  const current = map.get(id)
  if (current) {
    current.count += 1
    return
  }
  map.set(id, { id, label, count: 1 })
}

function bumpDaily(map: Map<string, number>, dateKey: string) {
  map.set(dateKey, (map.get(dateKey) ?? 0) + 1)
}

function applyRowToUnitStats(stats: UnitPeriodStats, row: ConsultaAggregateRow) {
  stats.total += 1
  bumpDaily(stats.dailyCounts, spDateKey(row.criado_em))

  const status = String(row.status)
  if (status === 'concluida') {
    stats.completed += 1
    const duration = computeDurationMinutes(row)
    if (duration != null) {
      stats.durationSum += duration
      stats.durationCount += 1
    }
  } else if (status === 'cancelada' || status === 'interrompida') {
    stats.cancelled += 1
  } else {
    stats.inProgress += 1
  }

  bumpSpecialty(
    stats.specialtyCounts,
    String(row.especialidade_id),
    String(row.especialidade_nome || 'Especialidade'),
  )
  stats.genderCounts[mapSexoToGenderKey(row.paciente_sexo)] += 1
}

export function aggregateConsultas(rows: ConsultaAggregateRow[]): NetworkPeriodStats {
  const stats = emptyNetworkStats()

  for (const row of rows) {
    const unitId = String(row.unidade_ubt_id)
    const unitStats = stats.byUnit.get(unitId) ?? emptyUnitStats()
    applyRowToUnitStats(unitStats, row)
    stats.byUnit.set(unitId, unitStats)

    stats.total += 1
    bumpDaily(stats.dailyCounts, spDateKey(row.criado_em))

    const status = String(row.status)
    if (status === 'concluida') {
      stats.completed += 1
      const duration = computeDurationMinutes(row)
      if (duration != null) {
        stats.durationSum += duration
        stats.durationCount += 1
      }
    } else if (status === 'cancelada' || status === 'interrompida') {
      stats.cancelled += 1
    } else {
      stats.inProgress += 1
    }

    bumpSpecialty(
      stats.specialtyCounts,
      String(row.especialidade_id),
      String(row.especialidade_nome || 'Especialidade'),
    )
    stats.genderCounts[mapSexoToGenderKey(row.paciente_sexo)] += 1
  }

  return stats
}

function avgDuration(stats: Pick<UnitPeriodStats, 'durationSum' | 'durationCount'>): number {
  if (stats.durationCount <= 0) return 0
  return Math.round(stats.durationSum / stats.durationCount)
}

export function completionRate(completed: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((completed / total) * 1000) / 10
}

export function cancelledRate(cancelled: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((cancelled / total) * 1000) / 10
}

export function resolveSlaStatus(completionRateValue: number, cancelledRateValue: number) {
  if (completionRateValue >= 92 && cancelledRateValue <= 10) return 'normal' as const
  if (completionRateValue >= 85 && cancelledRateValue <= 15) return 'atencao' as const
  return 'critico' as const
}

export function buildUnitRow(unit: RedeUnitApi, stats: UnitPeriodStats): PrefeituraConsultasUnitRowDto {
  const completionRateValue = completionRate(stats.completed, stats.total)
  const cancelledRateValue = cancelledRate(stats.cancelled, stats.total)

  return {
    id: unit.id,
    name: unit.name,
    address: unit.address,
    region: unit.region,
    regionKey: unit.regionKey,
    volumeTotal: stats.total,
    completed: stats.completed,
    completionRate: completionRateValue,
    cancelled: stats.cancelled,
    cancelledRate: cancelledRateValue,
    avgDurationMin: avgDuration(stats),
    status: resolveSlaStatus(completionRateValue, cancelledRateValue),
  }
}

export function buildDailySeries(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
): PrefeituraConsultasDailyPointDto[] {
  const start = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)
  const points: PrefeituraConsultasDailyPointDto[] = []

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10)
    points.push({
      date,
      label: spDateLabel(date),
      value: dailyCounts.get(date) ?? 0,
    })
  }

  if (points.length <= 8) return points

  const step = Math.ceil(points.length / 6)
  const sampled: PrefeituraConsultasDailyPointDto[] = []
  for (let index = 0; index < points.length; index += step) {
    sampled.push(points[index]!)
  }
  const last = points[points.length - 1]
  if (last && sampled[sampled.length - 1]?.date !== last.date) {
    sampled.push(last)
  }
  return sampled
}

export function buildSpecialtyItems(
  specialtyCounts: Map<string, { id: string; label: string; count: number }>,
  total: number,
): PrefeituraConsultasSpecialtyItemDto[] {
  return [...specialtyCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item, index) => ({
      key: item.id,
      label: item.label,
      sharePercent: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color: SPECIALTY_COLORS[index % SPECIALTY_COLORS.length]!,
    }))
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function deltaLabel(current: number, previous: number, suffix: string): string {
  if (previous <= 0) {
    return current > 0 ? 'Sem base no período anterior' : 'Sem variação'
  }
  const delta = Math.round(((current - previous) / previous) * 100)
  if (delta === 0) return 'Estável vs período anterior'
  return `${delta > 0 ? '+' : ''}${delta}${suffix}`
}

function deltaPpLabel(current: number, previous: number): string {
  const delta = Math.round((current - previous) * 10) / 10
  if (delta === 0) return 'Estável vs período anterior'
  return `${delta > 0 ? '+' : ''}${formatPercent(delta)} p.p. vs período anterior`
}

export function buildKpis(current: NetworkPeriodStats, previous: NetworkPeriodStats): PrefeituraConsultasKpiDto[] {
  const currentCompletion = completionRate(current.completed, current.total)
  const previousCompletion = completionRate(previous.completed, previous.total)
  const currentAvg = avgDuration(current)
  const previousAvg = avgDuration(previous)
  const topSpecialty = [...current.specialtyCounts.values()].sort((a, b) => b.count - a.count)[0]

  const volumeDelta = previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0
  const durationDelta = currentAvg - previousAvg

  return [
    {
      label: 'Volume de consultas',
      value: formatNumber(current.total),
      footer: deltaLabel(current.total, previous.total, '% vs período anterior'),
      footerTone: volumeDelta >= 0 ? 'positive' : 'muted',
      footerIcon: volumeDelta >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Taxa de conclusão',
      value: `${formatPercent(currentCompletion)}%`,
      footer: deltaPpLabel(currentCompletion, previousCompletion),
      footerTone: currentCompletion >= previousCompletion ? 'positive' : 'muted',
      footerIcon: currentCompletion >= previousCompletion ? 'up' : 'down',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Cancelamentos',
      value: formatNumber(current.cancelled),
      footer: `${formatPercent(cancelledRate(current.cancelled, current.total))}% do total`,
      footerTone: 'muted',
      footerIcon: 'dot',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Duração média',
      value: currentAvg > 0 ? `${currentAvg} min` : '—',
      footer:
        previousAvg > 0
          ? `${durationDelta > 0 ? '+' : ''}${durationDelta} min vs período anterior`
          : 'Sem base no período anterior',
      footerTone: durationDelta <= 0 ? 'positive' : 'muted',
      footerIcon: durationDelta <= 0 ? 'down' : 'up',
      topBar: 'from-cyan-400 to-sky-500',
    },
    {
      label: 'Especialidade mais demandada',
      value: topSpecialty?.label ?? '—',
      footer: topSpecialty
        ? `${Math.round((topSpecialty.count / Math.max(current.total, 1)) * 100)}% do total`
        : 'Sem consultas no período',
      footerTone: 'neutral',
      topBar: 'from-indigo-400 to-blue-600',
    },
  ]
}

export function buildFilterOptionsFromUnits(units: RedeUnitApi[]) {
  const redeFilters = buildFilterOptions(units)
  return {
    units: [
      { value: '', label: 'Selecione uma unidade' },
      ...units.map((unit) => ({ value: unit.id, label: unit.name })),
      { value: 'todas', label: 'Todas as unidades' },
    ],
    regions: [
      { value: '', label: 'Selecione uma região' },
      ...redeFilters.regions.filter((item) => item.value !== 'todas'),
      { value: 'todas', label: 'Todas as regiões' },
    ],
  }
}

export function buildGenderStats(genderCounts: { F: number; M: number; NI: number }, total: number) {
  const items = [
    { key: 'F' as const, label: 'Feminino', count: genderCounts.F, color: GENDER_COLORS.F },
    { key: 'M' as const, label: 'Masculino', count: genderCounts.M, color: GENDER_COLORS.M },
    {
      key: 'NI' as const,
      label: 'Não informado',
      count: genderCounts.NI,
      color: GENDER_COLORS.NI,
    },
  ]

  const base = Math.max(1, total)
  return items.map((item) => ({
    ...item,
    percent: Math.round((item.count / base) * 100),
  }))
}

export function buildSpecialtySlices(
  specialtyCounts: Map<string, { id: string; label: string; count: number }>,
  total: number,
) {
  return [...specialtyCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((item, index) => ({
      key: item.id,
      label: item.label,
      count: item.count,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color: SPECIALTY_COLORS[index % SPECIALTY_COLORS.length]!,
    }))
}

export function formatPeriodLabel(periodStart: string, periodEnd: string): string {
  const startLabel = spDateLabel(periodStart)
  const endLabel = spDateLabel(periodEnd)
  if (periodStart.slice(0, 7) === periodEnd.slice(0, 7)) {
    return `${startLabel} – ${endLabel}/${periodEnd.slice(0, 4).slice(2)}`
  }
  return `${startLabel}/${periodStart.slice(2, 4)} – ${endLabel}/${periodEnd.slice(2, 4)}`
}

export function computeDeltaPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 10) / 10
}

export function computeDeltaPp(current: number, previous: number): number {
  return Math.round((current - previous) * 10) / 10
}
