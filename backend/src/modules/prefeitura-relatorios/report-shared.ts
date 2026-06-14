import { supabaseAdmin } from '../../db/supabase.js'
import { buildDailySeries } from '../prefeitura-consultas/formatters.js'
import type { PrefeituraConsultasDailyPointDto } from '../prefeitura-consultas/types.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'

export const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

export function countDaysInclusive(periodStart: string, periodEnd: string) {
  const start = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

export function filterUnitsByParams(
  units: RedeUnitApi[],
  params: { unidadeUbtId?: string; regionKey?: string },
) {
  let filtered = units.filter((unit) => unit.status !== 'inativa')

  if (params.regionKey && params.regionKey !== 'todas') {
    filtered = filtered.filter((unit) => unit.regionKey === params.regionKey)
  }

  if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
    filtered = filtered.filter((unit) => unit.id === params.unidadeUbtId)
  }

  return filtered
}

export async function resolveEntidadeRazaoSocial(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('razao_social')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  return data?.razao_social ? String(data.razao_social) : 'Prefeitura'
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function conversionPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

export function bumpCount(map: Map<string, number>, key: string, delta = 1) {
  map.set(key, (map.get(key) ?? 0) + delta)
}

export function bumpSpecialty(
  map: Map<string, { id: string; label: string; count: number }>,
  id: string,
  label: string,
  delta = 1,
) {
  const current = map.get(id) ?? { id, label: label || 'Especialidade', count: 0 }
  current.count += delta
  map.set(id, current)
}

export function buildMonthlyEvolutionSeries(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
) {
  const monthBuckets = new Map<string, number>()
  for (const [day, count] of dailyCounts) {
    const monthKey = day.slice(0, 7)
    monthBuckets.set(monthKey, (monthBuckets.get(monthKey) ?? 0) + count)
  }

  const points: Array<{ date: string; label: string; value: number }> = []
  const cursor = new Date(`${periodStart.slice(0, 7)}-01T12:00:00-03:00`)
  const endMonth = periodEnd.slice(0, 7)

  while (cursor.toISOString().slice(0, 7) <= endMonth) {
    const key = cursor.toISOString().slice(0, 7)
    const monthIndex = Number(key.slice(5, 7)) - 1
    points.push({
      date: `${key}-01`,
      label: MONTH_LABELS[monthIndex] ?? key,
      value: monthBuckets.get(key) ?? 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return points
}

export function useMonthlyEvolution(periodStart: string, periodEnd: string) {
  return countDaysInclusive(periodStart, periodEnd) > 45
}

export function buildMonthlySeriesFromDaily(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
): PrefeituraConsultasDailyPointDto[] {
  const monthly = new Map<string, number>()
  for (const [date, value] of dailyCounts) {
    const monthKey = date.slice(0, 7)
    monthly.set(monthKey, (monthly.get(monthKey) ?? 0) + value)
  }

  const start = new Date(`${periodStart.slice(0, 7)}-01T12:00:00-03:00`)
  const end = new Date(`${periodEnd.slice(0, 7)}-01T12:00:00-03:00`)
  const points: PrefeituraConsultasDailyPointDto[] = []

  for (let cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    const monthKey = cursor.toISOString().slice(0, 7)
    const monthIndex = Number(monthKey.slice(5, 7)) - 1
    points.push({
      date: `${monthKey}-01`,
      label: `${MONTH_LABELS[monthIndex] ?? monthKey}/${monthKey.slice(2, 4)}`,
      value: monthly.get(monthKey) ?? 0,
    })
  }

  return points
}

export function buildEvolutionSeries(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
): PrefeituraConsultasDailyPointDto[] {
  if (monthly) {
    return buildMonthlySeriesFromDaily(dailyCounts, periodStart, periodEnd)
  }
  return buildDailySeries(dailyCounts, periodStart, periodEnd)
}
