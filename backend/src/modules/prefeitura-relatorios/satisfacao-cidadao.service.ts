import {
  computeDeltaPp,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  avgMinutes,
  computeNpsFromRatings,
  loadQualityAvaliacoesInPeriod,
  resolveAvaliacaoNota,
  type QualityAvaliacaoRow,
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
  SatisfacaoCidadaoDimensionScoreDto,
  SatisfacaoCidadaoHighlightDto,
  SatisfacaoCidadaoReportDto,
  SatisfacaoCidadaoReportUnitRowDto,
} from './types.js'

function summarizeNps(rows: QualityAvaliacaoRow[]) {
  const ratings = rows.map((row) => resolveAvaliacaoNota(row))
  const npsResult = computeNpsFromRatings(ratings)
  const profScores = rows
    .filter((row) => typeof row.nota_profissional === 'number')
    .map((row) => row.nota_profissional!)
  const teleScores = rows
    .filter((row) => typeof row.nota_teleconsulta === 'number')
    .map((row) => row.nota_teleconsulta!)

  return {
    ...npsResult,
    avgRating: avgMinutes(ratings),
    ratingCount: rows.length,
    avgProfissional: avgMinutes(profScores),
    avgTeleconsulta: avgMinutes(teleScores),
  }
}

function buildDimensions(
  current: ReturnType<typeof summarizeNps>,
  previous: ReturnType<typeof summarizeNps>,
): SatisfacaoCidadaoDimensionScoreDto[] {
  return [
    {
      key: 'geral',
      label: 'Satisfação geral',
      avgScore: current.avgRating,
      scoreDeltaPp: computeDeltaPp(current.avgRating, previous.avgRating),
    },
    {
      key: 'profissional',
      label: 'Atendimento do profissional',
      avgScore: current.avgProfissional,
      scoreDeltaPp: computeDeltaPp(current.avgProfissional, previous.avgProfissional),
    },
    {
      key: 'teleconsulta',
      label: 'Experiência da teleconsulta',
      avgScore: current.avgTeleconsulta,
      scoreDeltaPp: computeDeltaPp(current.avgTeleconsulta, previous.avgTeleconsulta),
    },
  ]
}

function buildHighlights(
  current: ReturnType<typeof summarizeNps>,
  previous: ReturnType<typeof summarizeNps>,
): SatisfacaoCidadaoHighlightDto[] {
  const npsDelta = computeDeltaPp(current.nps, previous.nps)

  return [
    {
      id: 'nps',
      title: 'NPS do período',
      subtitle: `${formatNumber(current.nps)} · ${npsDelta >= 0 ? '+' : ''}${formatPercent(npsDelta)} p.p. vs anterior`,
      tone: current.nps >= 50 ? 'green' : current.nps >= 30 ? 'amber' : 'red',
    },
    {
      id: 'promoters',
      title: 'Promotores',
      subtitle: `${formatPercent(current.promotersPercent)}% das avaliações`,
      tone: 'green',
    },
    {
      id: 'detractors',
      title: 'Detratores',
      subtitle: `${formatPercent(current.detractorsPercent)}% das avaliações`,
      tone: current.detractorsPercent > 15 ? 'red' : 'amber',
    },
    {
      id: 'avg-rating',
      title: 'Nota média',
      subtitle: `${formatNumber(current.avgRating)} estrelas · ${formatNumber(current.ratingCount)} respostas`,
      tone: 'blue',
    },
  ]
}

function buildUnitRows(
  units: RedeUnitApi[],
  rows: QualityAvaliacaoRow[],
  networkNps: number,
): SatisfacaoCidadaoReportUnitRowDto[] {
  const byUnit = new Map<string, QualityAvaliacaoRow[]>()
  for (const unit of units) {
    byUnit.set(unit.id, [])
  }

  for (const row of rows) {
    const bucket = byUnit.get(row.unidade_ubt_id)
    if (bucket) bucket.push(row)
  }

  return units
    .map((unit) => {
      const bucket = byUnit.get(unit.id) ?? []
      const ratings = bucket.map((row) => resolveAvaliacaoNota(row))
      const nps = computeNpsFromRatings(ratings).nps
      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        nps,
        avgRating: avgMinutes(ratings),
        ratingCount: bucket.length,
        npsVsNetworkPp: Math.round((nps - networkNps) * 10) / 10,
      }
    })
    .filter((row) => row.ratingCount > 0)
    .sort((a, b) => b.nps - a.nps)
}

function buildEvolution(rows: QualityAvaliacaoRow[], periodStart: string, periodEnd: string, monthly: boolean) {
  const byDate = new Map<string, QualityAvaliacaoRow[]>()

  for (const row of rows) {
    const date = row.avaliado_em.slice(0, 10)
    const bucket = byDate.get(date) ?? []
    bucket.push(row)
    byDate.set(date, bucket)
  }

  const npsByDate = new Map<string, number>()
  const avgByDate = new Map<string, number>()

  for (const [date, bucket] of byDate) {
    const ratings = bucket.map((row) => resolveAvaliacaoNota(row))
    npsByDate.set(date, computeNpsFromRatings(ratings).nps)
    avgByDate.set(date, avgMinutes(ratings))
  }

  return {
    npsPoints: buildEvolutionSeries(npsByDate, periodStart, periodEnd, monthly),
    avgRatingPoints: buildEvolutionSeries(avgByDate, periodStart, periodEnd, monthly),
  }
}

function buildKpis(summary: SatisfacaoCidadaoReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'NPS',
      value: formatNumber(summary.nps),
      footer:
        summary.npsDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.npsDeltaPp > 0 ? '+' : ''}${formatPercent(summary.npsDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.npsDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.npsDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Promotores',
      value: `${formatPercent(summary.promotersPercent)}%`,
      footer: `${formatPercent(summary.passivesPercent)}% neutros · ${formatPercent(summary.detractorsPercent)}% detratores`,
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Nota média',
      value: formatNumber(summary.avgRating),
      footer:
        summary.avgRatingDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.avgRatingDeltaPp > 0 ? '+' : ''}${formatPercent(summary.avgRatingDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.avgRatingDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.avgRatingDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Respostas coletadas',
      value: formatNumber(summary.ratingCount),
      footer: `${formatNumber(summary.unitsCount)} unidades no recorte`,
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getSatisfacaoCidadaoReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<SatisfacaoCidadaoReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [currentRows, previousRows] = await Promise.all([
    loadQualityAvaliacoesInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadQualityAvaliacoesInPeriod(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
  ])

  const current = summarizeNps(currentRows)
  const prev = summarizeNps(previousRows)

  const summary = {
    nps: current.nps,
    promotersPercent: current.promotersPercent,
    passivesPercent: current.passivesPercent,
    detractorsPercent: current.detractorsPercent,
    avgRating: current.avgRating,
    ratingCount: current.ratingCount,
    npsDeltaPp: computeDeltaPp(current.nps, prev.nps),
    avgRatingDeltaPp: computeDeltaPp(current.avgRating, prev.avgRating),
    unitsCount: visibleUnits.length,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const evolution = buildEvolution(currentRows, params.periodStart, params.periodEnd, monthly)
  const units = buildUnitRows(visibleUnits, currentRows, current.nps)

  return {
    reportId: 'satisfacao-cidadao',
    title: 'Satisfação do cidadão',
    description:
      'Indicadores consolidados de satisfação com o serviço, incluindo NPS e tendências de melhoria ou queda.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(current, prev),
    dimensions: buildDimensions(current, prev),
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      ...evolution,
    },
  }
}
