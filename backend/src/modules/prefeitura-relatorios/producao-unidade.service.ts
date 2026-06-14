import { supabaseAdmin } from '../../db/supabase.js'
import {
  aggregateConsultas,
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { getPrefeituraConsultasOverview } from '../prefeitura-consultas/overview.service.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import { fetchConsultasForPeriod } from '../prefeitura-consultas/query.service.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { PrefeituraConsultasDailyPointDto } from '../prefeitura-consultas/types.js'
import type { ProducaoUnidadeReportDto } from './types.js'

const MONTH_LABELS = [
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

function countDaysInclusive(periodStart: string, periodEnd: string) {
  const start = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

function buildDailyEvolutionSeries(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
): PrefeituraConsultasDailyPointDto[] {
  const start = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)
  const points: PrefeituraConsultasDailyPointDto[] = []

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10)
    const [, month, day] = date.split('-')
    points.push({
      date,
      label: `${day}/${month}`,
      value: dailyCounts.get(date) ?? 0,
    })
  }

  return points
}

function buildMonthlyEvolutionSeries(
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

async function resolveEntidadeRazaoSocial(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('razao_social')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  return data?.razao_social ? String(data.razao_social) : 'Prefeitura'
}

export async function getProducaoUnidadeReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<ProducaoUnidadeReportDto> {
  const [overview, entidadeRazaoSocial, allUnits] = await Promise.all([
    getPrefeituraConsultasOverview(entidadeId, params),
    resolveEntidadeRazaoSocial(entidadeId),
    listRedeUnits(entidadeId),
  ])

  const visibleUnitIds = overview.units.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)

  const [currentRows, previousRows] = await Promise.all([
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd, visibleUnitIds),
    fetchConsultasForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      visibleUnitIds,
    ),
  ])

  const currentStats = aggregateConsultas(currentRows)
  const previousStats = aggregateConsultas(previousRows)
  const dayCount = countDaysInclusive(params.periodStart, params.periodEnd)
  const useMonthlyEvolution = dayCount > 45
  const activeUnits = allUnits.filter((unit) => unit.status !== 'inativa')
  const networkAvgVolume =
    activeUnits.length > 0 ? currentStats.total / activeUnits.length : 0

  const units = overview.units.map((unit) => ({
    ...unit,
    sharePercent:
      currentStats.total > 0
        ? Math.round((unit.volumeTotal / currentStats.total) * 1000) / 10
        : 0,
    volumeVsNetworkPercent:
      networkAvgVolume > 0
        ? Math.round(((unit.volumeTotal - networkAvgVolume) / networkAvgVolume) * 1000) / 10
        : 0,
  }))

  return {
    reportId: 'producao-unidade',
    title: 'Produção por unidade',
    description:
      'Volume de consultas realizadas por UBT no período, com comparativo entre unidades e evolução diária ou mensal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary: {
      periodTotal: currentStats.total,
      unitsCount: units.length,
      networkAvgVolume: Math.round(networkAvgVolume),
      volumeDeltaPercent: computeDeltaPercent(currentStats.total, previousStats.total),
      kpis: overview.kpis,
    },
    units,
    evolution: {
      mode: useMonthlyEvolution ? 'monthly' : 'daily',
      points: useMonthlyEvolution
        ? buildMonthlyEvolutionSeries(
            currentStats.dailyCounts,
            params.periodStart,
            params.periodEnd,
          )
        : buildDailyEvolutionSeries(
            currentStats.dailyCounts,
            params.periodStart,
            params.periodEnd,
          ),
    },
  }
}
