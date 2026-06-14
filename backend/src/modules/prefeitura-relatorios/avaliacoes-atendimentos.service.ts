import {
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  avgMinutes,
  loadQualityAvaliacoesInPeriod,
  resolveAvaliacaoNota,
  type QualityAvaliacaoRow,
} from './quality-data.service.js'
import {
  buildEvolutionSeries,
  conversionPercent,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  AvaliacoesAtendimentosCommentSampleDto,
  AvaliacoesAtendimentosDistributionRowDto,
  AvaliacoesAtendimentosHighlightDto,
  AvaliacoesAtendimentosReportDto,
  AvaliacoesAtendimentosReportUnitRowDto,
} from './types.js'

function avgScore(values: number[]) {
  return avgMinutes(values)
}

function buildDistribution(rows: QualityAvaliacaoRow[]): AvaliacoesAtendimentosDistributionRowDto[] {
  const counts = new Map<number, number>()
  for (const row of rows) {
    const stars = Math.min(5, Math.max(1, Math.round(resolveAvaliacaoNota(row))))
    counts.set(stars, (counts.get(stars) ?? 0) + 1)
  }

  const total = rows.length
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts.get(stars) ?? 0,
    sharePercent: conversionPercent(counts.get(stars) ?? 0, total),
  }))
}

function buildCommentSamples(
  rows: QualityAvaliacaoRow[],
  unitNameById: Map<string, string>,
): AvaliacoesAtendimentosCommentSampleDto[] {
  const withComments = rows
    .map((row) => {
      const profComment = row.comentario_profissional.trim()
      const teleComment = row.comentario_teleconsulta.trim()
      const comentario = profComment || teleComment
      if (!comentario) return null

      return {
        id: row.id,
        unitName: unitNameById.get(row.unidade_ubt_id) ?? 'Unidade',
        professionalName: row.profissional_nome,
        nota: resolveAvaliacaoNota(row),
        notaProfissional: row.nota_profissional,
        notaTeleconsulta: row.nota_teleconsulta,
        comentario: comentario.slice(0, 280),
        avaliadoEm: row.avaliado_em,
      }
    })
    .filter((item): item is AvaliacoesAtendimentosCommentSampleDto => item != null)

  return withComments.slice(0, 12)
}

function buildUnitRows(
  units: RedeUnitApi[],
  rows: QualityAvaliacaoRow[],
  networkAvg: number,
): AvaliacoesAtendimentosReportUnitRowDto[] {
  const byUnit = new Map<
    string,
    { notas: number[]; prof: number[]; tele: number[] }
  >()

  for (const unit of units) {
    byUnit.set(unit.id, { notas: [], prof: [], tele: [] })
  }

  for (const row of rows) {
    const bucket = byUnit.get(row.unidade_ubt_id)
    if (!bucket) continue
    bucket.notas.push(resolveAvaliacaoNota(row))
    if (typeof row.nota_profissional === 'number') bucket.prof.push(row.nota_profissional)
    if (typeof row.nota_teleconsulta === 'number') bucket.tele.push(row.nota_teleconsulta)
  }

  return units
    .map((unit) => {
      const bucket = byUnit.get(unit.id) ?? { notas: [], prof: [], tele: [] }
      const avgNota = avgScore(bucket.notas)
      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        ratingCount: bucket.notas.length,
        avgNota,
        avgNotaProfissional: avgScore(bucket.prof),
        avgNotaTeleconsulta: avgScore(bucket.tele),
        avgVsNetworkPp: Math.round((avgNota - networkAvg) * 10) / 10,
      }
    })
    .sort((a, b) => b.ratingCount - a.ratingCount)
}

function buildHighlights(
  rows: QualityAvaliacaoRow[],
  distribution: AvaliacoesAtendimentosDistributionRowDto[],
  units: AvaliacoesAtendimentosReportUnitRowDto[],
): AvaliacoesAtendimentosHighlightDto[] {
  if (rows.length === 0) return []

  const topStars = distribution.find((row) => row.stars === 5)
  const lowStars = distribution.find((row) => row.stars <= 2)
  const bestUnit = [...units].filter((row) => row.ratingCount >= 3).sort((a, b) => b.avgNota - a.avgNota)[0]
  const worstUnit = [...units].filter((row) => row.ratingCount >= 3).sort((a, b) => a.avgNota - b.avgNota)[0]

  return [
    {
      id: 'top-rating',
      title: 'Avaliações 5 estrelas',
      subtitle: `${formatNumber(topStars?.count ?? 0)} · ${formatPercent(topStars?.sharePercent ?? 0)}% do total`,
      tone: 'green',
    },
    {
      id: 'low-rating',
      title: 'Avaliações críticas (1–2)',
      subtitle: `${formatNumber((distribution.find((r) => r.stars === 1)?.count ?? 0) + (distribution.find((r) => r.stars === 2)?.count ?? 0))} registros`,
      tone: lowStars && lowStars.count > 0 ? 'red' : 'green',
    },
    {
      id: 'best-unit',
      title: 'Melhor nota por unidade',
      subtitle: bestUnit
        ? `${bestUnit.name} · ${formatNumber(bestUnit.avgNota)} estrelas`
        : '—',
      tone: 'blue',
    },
    {
      id: 'worst-unit',
      title: 'Menor nota por unidade',
      subtitle: worstUnit
        ? `${worstUnit.name} · ${formatNumber(worstUnit.avgNota)} estrelas`
        : '—',
      tone: 'amber',
    },
  ]
}

function buildEvolution(rows: QualityAvaliacaoRow[], periodStart: string, periodEnd: string, monthly: boolean) {
  const countByDate = new Map<string, number>()
  const sumByDate = new Map<string, number>()

  for (const row of rows) {
    const date = row.avaliado_em.slice(0, 10)
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1)
    sumByDate.set(date, (sumByDate.get(date) ?? 0) + resolveAvaliacaoNota(row))
  }

  const avgByDate = new Map<string, number>()
  for (const [date, count] of countByDate) {
    const sum = sumByDate.get(date) ?? 0
    avgByDate.set(date, count > 0 ? Math.round((sum / count) * 10) / 10 : 0)
  }

  return {
    ratingCountPoints: buildEvolutionSeries(countByDate, periodStart, periodEnd, monthly),
    avgRatingPoints: buildEvolutionSeries(avgByDate, periodStart, periodEnd, monthly),
  }
}

function summarizeRows(rows: QualityAvaliacaoRow[]) {
  const notas = rows.map((row) => resolveAvaliacaoNota(row))
  const prof = rows.filter((row) => typeof row.nota_profissional === 'number').map((row) => row.nota_profissional!)
  const tele = rows.filter((row) => typeof row.nota_teleconsulta === 'number').map((row) => row.nota_teleconsulta!)

  return {
    ratingCount: rows.length,
    avgNota: avgScore(notas),
    avgNotaProfissional: avgScore(prof),
    avgNotaTeleconsulta: avgScore(tele),
  }
}

function buildKpis(summary: AvaliacoesAtendimentosReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Avaliações recebidas',
      value: formatNumber(summary.ratingCount),
      footer:
        summary.ratingCountDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.ratingCountDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.ratingCountDeltaPercent)}% vs período anterior`,
      footerTone: summary.ratingCountDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.ratingCountDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Nota média geral',
      value: formatNumber(summary.avgNota),
      footer:
        summary.avgNotaDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.avgNotaDeltaPp > 0 ? '+' : ''}${formatPercent(summary.avgNotaDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.avgNotaDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.avgNotaDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Nota do profissional',
      value: formatNumber(summary.avgNotaProfissional),
      footer: 'Média das avaliações do atendimento clínico',
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Nota da teleconsulta',
      value: formatNumber(summary.avgNotaTeleconsulta),
      footer: 'Média das avaliações da experiência digital',
      footerTone: 'neutral',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getAvaliacoesAtendimentosReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<AvaliacoesAtendimentosReportDto> {
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
    loadQualityAvaliacoesInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadQualityAvaliacoesInPeriod(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
  ])

  const currentSummary = summarizeRows(currentRows)
  const previousSummary = summarizeRows(previousRows)
  const distribution = buildDistribution(currentRows)
  const units = buildUnitRows(visibleUnits, currentRows, currentSummary.avgNota)
  const comments = buildCommentSamples(currentRows, unitNameById)

  const summary = {
    ...currentSummary,
    unitsCount: visibleUnits.length,
    ratingCountDeltaPercent: computeDeltaPercent(
      currentSummary.ratingCount,
      previousSummary.ratingCount,
    ),
    avgNotaDeltaPp: computeDeltaPp(currentSummary.avgNota, previousSummary.avgNota),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const evolution = buildEvolution(currentRows, params.periodStart, params.periodEnd, monthly)

  return {
    reportId: 'avaliacoes-atendimentos',
    title: 'Avaliações dos atendimentos',
    description:
      'Notas e comentários registrados pelos pacientes após a consulta, agregados por período e unidade.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(currentRows, distribution, units),
    distribution,
    comments,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      ...evolution,
    },
  }
}
