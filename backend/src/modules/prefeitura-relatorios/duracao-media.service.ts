import {
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  avgMinutes,
  loadQualityConsultasInPeriod,
  medianMinutes,
  resolveConsultaDurationMinutes,
  type QualityConsultaRow,
} from './quality-data.service.js'
import {
  buildEvolutionSeries,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  DuracaoMediaHighlightDto,
  DuracaoMediaOutlierRowDto,
  DuracaoMediaProfessionalRowDto,
  DuracaoMediaReportDto,
  DuracaoMediaReportUnitRowDto,
  DuracaoMediaSpecialtyRowDto,
} from './types.js'

function consultaDateKey(row: QualityConsultaRow): string {
  return row.finalizada_em?.slice(0, 10) ?? row.criado_em.slice(0, 10)
}

function completedWithDuration(rows: QualityConsultaRow[]) {
  return rows
    .filter((row) => String(row.status) === 'concluida')
    .map((row) => ({ row, duration: resolveConsultaDurationMinutes(row) }))
    .filter((entry) => entry.duration != null) as Array<{
    row: QualityConsultaRow
    duration: number
  }>
}

function durationVsNetworkPercent(avg: number, networkAvg: number) {
  if (networkAvg <= 0) return 0
  return Math.round(((avg / networkAvg) * 100 - 100) * 10) / 10
}

function buildSpecialtyRows(
  entries: Array<{ row: QualityConsultaRow; duration: number }>,
  networkAvg: number,
): DuracaoMediaSpecialtyRowDto[] {
  const map = new Map<string, { id: string; name: string; durations: number[] }>()

  for (const { row, duration } of entries) {
    const id = String(row.especialidade_id)
    const current = map.get(id) ?? { id, name: String(row.especialidade_nome), durations: [] }
    current.durations.push(duration)
    map.set(id, current)
  }

  return [...map.values()]
    .map((item) => {
      const avg = avgMinutes(item.durations)
      return {
        id: item.id,
        name: item.name,
        avgMinutes: avg,
        medianMinutes: medianMinutes(item.durations),
        consultaCount: item.durations.length,
        durationVsNetworkPercent: durationVsNetworkPercent(avg, networkAvg),
      }
    })
    .sort((a, b) => b.consultaCount - a.consultaCount)
}

function buildProfessionalRows(
  entries: Array<{ row: QualityConsultaRow; duration: number }>,
): DuracaoMediaProfessionalRowDto[] {
  const map = new Map<
    string,
    { id: string; name: string; especialidadeName: string; durations: number[] }
  >()

  for (const { row, duration } of entries) {
    const id = row.profissional_id ? String(row.profissional_id) : `unknown-${row.profissional_nome}`
    const current = map.get(id) ?? {
      id,
      name: String(row.profissional_nome),
      especialidadeName: String(row.especialidade_nome),
      durations: [],
    }
    current.durations.push(duration)
    map.set(id, current)
  }

  return [...map.values()]
    .map((item) => ({
      id: item.id,
      name: item.name,
      especialidadeName: item.especialidadeName,
      avgMinutes: avgMinutes(item.durations),
      medianMinutes: medianMinutes(item.durations),
      consultaCount: item.durations.length,
    }))
    .sort((a, b) => b.consultaCount - a.consultaCount)
}

function buildUnitRows(
  units: RedeUnitApi[],
  entries: Array<{ row: QualityConsultaRow; duration: number }>,
  networkAvg: number,
): DuracaoMediaReportUnitRowDto[] {
  const map = new Map<string, number[]>()
  for (const unit of units) map.set(unit.id, [])

  for (const { row, duration } of entries) {
    const bucket = map.get(String(row.unidade_ubt_id))
    if (bucket) bucket.push(duration)
  }

  return units
    .map((unit) => {
      const durations = map.get(unit.id) ?? []
      const avg = avgMinutes(durations)
      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        avgMinutes: avg,
        medianMinutes: medianMinutes(durations),
        consultaCount: durations.length,
        durationVsNetworkPercent: durationVsNetworkPercent(avg, networkAvg),
      }
    })
    .sort((a, b) => b.consultaCount - a.consultaCount)
}

function buildOutliers(
  entries: Array<{ row: QualityConsultaRow; duration: number }>,
  unitNameById: Map<string, string>,
  networkAvg: number,
  threshold = 1.5,
): DuracaoMediaOutlierRowDto[] {
  const limit = networkAvg * threshold
  return entries
    .filter(({ duration }) => duration > limit)
    .map(({ row, duration }) => ({
      consultaId: String(row.id),
      unitName: unitNameById.get(String(row.unidade_ubt_id)) ?? 'Unidade',
      specialtyName: String(row.especialidade_nome),
      professionalName: String(row.profissional_nome),
      durationMinutes: duration,
      networkAvgMinutes: networkAvg,
    }))
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 20)
}

function buildHighlights(
  specialties: DuracaoMediaSpecialtyRowDto[],
  units: DuracaoMediaReportUnitRowDto[],
  outliers: DuracaoMediaOutlierRowDto[],
  networkAvg: number,
): DuracaoMediaHighlightDto[] {
  if (specialties.length === 0) return []

  const longest = [...specialties].sort((a, b) => b.avgMinutes - a.avgMinutes)[0]
  const shortest = [...specialties]
    .filter((row) => row.consultaCount >= 3)
    .sort((a, b) => a.avgMinutes - b.avgMinutes)[0]
  const longestUnit = [...units].filter((row) => row.consultaCount >= 3).sort(
    (a, b) => b.avgMinutes - a.avgMinutes,
  )[0]

  return [
    {
      id: 'network-avg',
      title: 'Duração média da rede',
      subtitle: `${formatNumber(networkAvg)} min no período analisado`,
      tone: 'blue',
    },
    {
      id: 'longest-specialty',
      title: 'Especialidade com maior duração',
      subtitle: `${longest?.name ?? '—'} · ${formatNumber(longest?.avgMinutes ?? 0)} min`,
      tone: 'amber',
    },
    {
      id: 'shortest-specialty',
      title: 'Especialidade com menor duração',
      subtitle: shortest
        ? `${shortest.name} · ${formatNumber(shortest.avgMinutes)} min`
        : '—',
      tone: 'green',
    },
    {
      id: 'outliers',
      title: 'Consultas com duração atípica',
      subtitle: `${formatNumber(outliers.length)} consultas acima de 1,5× a média da rede`,
      tone: longestUnit && longestUnit.avgMinutes > networkAvg * 1.2 ? 'red' : 'amber',
    },
  ]
}

function buildEvolutionFromEntries(
  entries: Array<{ row: QualityConsultaRow; duration: number }>,
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
) {
  const sumByDate = new Map<string, number>()
  const countByDate = new Map<string, number>()

  for (const { row, duration } of entries) {
    const date = consultaDateKey(row)
    sumByDate.set(date, (sumByDate.get(date) ?? 0) + duration)
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1)
  }

  const avgByDate = new Map<string, number>()
  for (const [date, count] of countByDate) {
    const sum = sumByDate.get(date) ?? 0
    avgByDate.set(date, count > 0 ? Math.round((sum / count) * 10) / 10 : 0)
  }

  return {
    durationPoints: buildEvolutionSeries(avgByDate, periodStart, periodEnd, monthly),
    volumePoints: buildEvolutionSeries(countByDate, periodStart, periodEnd, monthly),
  }
}

function buildKpis(summary: DuracaoMediaReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Duração média',
      value: `${formatNumber(summary.avgDurationMinutes)} min`,
      footer:
        summary.durationDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.durationDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.durationDeltaPercent)}% vs período anterior`,
      footerTone: summary.durationDeltaPercent <= 0 ? 'positive' : 'muted',
      footerIcon: summary.durationDeltaPercent <= 0 ? 'down' : 'up',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Duração mediana',
      value: `${formatNumber(summary.medianDurationMinutes)} min`,
      footer: 'Mediana das consultas concluídas com tempo registrado',
      footerTone: 'neutral',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Consultas analisadas',
      value: formatNumber(summary.consultaCount),
      footer: `${formatNumber(summary.unitsCount)} unidades no recorte`,
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Outliers detectados',
      value: formatNumber(summary.outlierCount),
      footer: 'Consultas com duração superior a 1,5× a média da rede',
      footerTone: summary.outlierCount > 0 ? 'muted' : 'positive',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getDuracaoMediaReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<DuracaoMediaReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const unitNameById = new Map(visibleUnits.map((unit) => [unit.id, unit.name]))
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [currentRows, previousRows] = await Promise.all([
    loadQualityConsultasInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadQualityConsultasInPeriod(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
  ])

  const currentEntries = completedWithDuration(currentRows)
  const previousEntries = completedWithDuration(previousRows)
  const allDurations = currentEntries.map((entry) => entry.duration)
  const networkAvg = avgMinutes(allDurations)
  const previousAvg = avgMinutes(previousEntries.map((entry) => entry.duration))

  const specialties = buildSpecialtyRows(currentEntries, networkAvg)
  const professionals = buildProfessionalRows(currentEntries)
  const units = buildUnitRows(visibleUnits, currentEntries, networkAvg)
  const outliers = buildOutliers(currentEntries, unitNameById, networkAvg)

  const summary = {
    avgDurationMinutes: networkAvg,
    medianDurationMinutes: medianMinutes(allDurations),
    consultaCount: currentEntries.length,
    outlierCount: outliers.length,
    unitsCount: visibleUnits.length,
    specialtiesCount: specialties.length,
    durationDeltaPercent: computeDeltaPercent(networkAvg, previousAvg),
    avgDurationDeltaMinutes: Math.round((networkAvg - previousAvg) * 10) / 10,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const evolution = buildEvolutionFromEntries(
    currentEntries,
    params.periodStart,
    params.periodEnd,
    monthly,
  )

  return {
    reportId: 'duracao-media',
    title: 'Duração média das consultas',
    description:
      'Tempo médio de atendimento por especialidade, profissional ou unidade, com outliers e desvios.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(specialties, units, outliers, networkAvg),
    specialties,
    professionals,
    units,
    outliers,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      ...evolution,
    },
  }
}
