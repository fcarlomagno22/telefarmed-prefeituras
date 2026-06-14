import {
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
  loadQualityConsultasInPeriod,
  QUALITY_THRESHOLDS,
  resolveAvaliacaoNota,
  resolveConsultaDurationMinutes,
  type QualityAvaliacaoRow,
  type QualityConsultaRow,
} from './quality-data.service.js'
import {
  buildEvolutionSeries,
  conversionPercent,
  filterUnitsByParams,
  formatNumber,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  UnidadesCriticasEntityRowDto,
  UnidadesCriticasHighlightDto,
  UnidadesCriticasIssueDto,
  UnidadesCriticasReportDto,
} from './types.js'

type EntityAccumulator = {
  id: string
  name: string
  region?: string
  regionKey?: string
  total: number
  completed: number
  interruptions: number
  durations: number[]
  ratings: number[]
}

function emptyAccumulator(
  id: string,
  name: string,
  region?: string,
  regionKey?: string,
): EntityAccumulator {
  return {
    id,
    name,
    region,
    regionKey,
    total: 0,
    completed: 0,
    interruptions: 0,
    durations: [],
    ratings: [],
  }
}

function accumulateConsulta(acc: EntityAccumulator, row: QualityConsultaRow) {
  acc.total += 1
  const status = String(row.status)
  if (status === 'concluida') {
    acc.completed += 1
    const duration = resolveConsultaDurationMinutes(row)
    if (duration != null) acc.durations.push(duration)
  } else if (status === 'interrompida') {
    acc.interruptions += 1
  }
}

function accumulateAvaliacao(acc: EntityAccumulator, row: QualityAvaliacaoRow) {
  acc.ratings.push(resolveAvaliacaoNota(row))
}

function issueSeverity(
  key: UnidadesCriticasIssueDto['key'],
  value: number,
  threshold: number,
): 'warning' | 'critical' | null {
  switch (key) {
    case 'completion':
      if (value >= threshold) return null
      return value < threshold - 7 ? 'critical' : 'warning'
    case 'rating':
      if (value >= threshold) return null
      return value < threshold - 0.5 ? 'critical' : 'warning'
    case 'interruption':
      if (value <= threshold) return null
      return value > threshold + 3 ? 'critical' : 'warning'
    case 'nps':
      if (value >= threshold) return null
      return value < threshold - 20 ? 'critical' : 'warning'
    case 'duration':
      if (value >= QUALITY_THRESHOLDS.minAvgDurationMinutes && value <= threshold) return null
      if (value < QUALITY_THRESHOLDS.minAvgDurationMinutes) {
        return value < QUALITY_THRESHOLDS.minAvgDurationMinutes - 2 ? 'critical' : 'warning'
      }
      return value > threshold + 10 ? 'critical' : 'warning'
    default:
      return null
  }
}

function buildIssues(metrics: {
  completionRatePercent: number
  avgRating: number
  interruptionRatePercent: number
  nps: number
  avgDurationMinutes: number
}): UnidadesCriticasIssueDto[] {
  const candidates: Array<{
    key: UnidadesCriticasIssueDto['key']
    label: string
    value: number
    threshold: number
  }> = [
    {
      key: 'completion',
      label: 'Taxa de conclusão',
      value: metrics.completionRatePercent,
      threshold: QUALITY_THRESHOLDS.minCompletionRatePercent,
    },
    {
      key: 'rating',
      label: 'Nota média',
      value: metrics.avgRating,
      threshold: QUALITY_THRESHOLDS.minAvgRating,
    },
    {
      key: 'interruption',
      label: 'Taxa de interrupção',
      value: metrics.interruptionRatePercent,
      threshold: QUALITY_THRESHOLDS.maxInterruptionRatePercent,
    },
    {
      key: 'nps',
      label: 'NPS',
      value: metrics.nps,
      threshold: QUALITY_THRESHOLDS.minNps,
    },
    {
      key: 'duration',
      label: 'Duração média (min)',
      value: metrics.avgDurationMinutes,
      threshold: QUALITY_THRESHOLDS.maxAvgDurationMinutes,
    },
  ]

  const issues: UnidadesCriticasIssueDto[] = []
  for (const candidate of candidates) {
    const severity = issueSeverity(candidate.key, candidate.value, candidate.threshold)
    if (!severity) continue
    issues.push({
      key: candidate.key,
      label: candidate.label,
      value: candidate.value,
      threshold: candidate.threshold,
      severity,
    })
  }
  return issues
}

function toEntityRow(
  acc: EntityAccumulator,
  type: 'unit' | 'specialty',
): UnidadesCriticasEntityRowDto | null {
  if (acc.total < 3 && acc.ratings.length < 3) return null

  const completionRatePercent = conversionPercent(acc.completed, acc.total)
  const interruptionRatePercent = conversionPercent(acc.interruptions, acc.total)
  const avgRating = avgMinutes(acc.ratings)
  const nps = computeNpsFromRatings(acc.ratings).nps
  const avgDurationMinutes = avgMinutes(acc.durations)

  const metrics = {
    completionRatePercent,
    avgRating,
    interruptionRatePercent,
    nps,
    avgDurationMinutes,
  }
  const issues = buildIssues(metrics)
  if (issues.length === 0) return null

  const hasCritical = issues.some((issue) => issue.severity === 'critical')

  return {
    id: acc.id,
    name: acc.name,
    type,
    region: acc.region,
    regionKey: acc.regionKey,
    severity: hasCritical ? 'critical' : 'warning',
    issueCount: issues.length,
    issues,
    completionRatePercent,
    avgRating,
    interruptionRatePercent,
    nps,
    avgDurationMinutes,
  }
}

function aggregateEntities(
  units: RedeUnitApi[],
  consultas: QualityConsultaRow[],
  avaliacoes: QualityAvaliacaoRow[],
) {
  const unitMap = new Map<string, EntityAccumulator>()
  const specialtyMap = new Map<string, EntityAccumulator>()

  for (const unit of units) {
    unitMap.set(unit.id, emptyAccumulator(unit.id, unit.name, unit.region, unit.regionKey))
  }

  for (const row of consultas) {
    const unitAcc = unitMap.get(String(row.unidade_ubt_id))
    if (unitAcc) accumulateConsulta(unitAcc, row)

    const specialtyId = String(row.especialidade_id)
    const specialtyAcc =
      specialtyMap.get(specialtyId) ??
      emptyAccumulator(specialtyId, String(row.especialidade_nome))
    accumulateConsulta(specialtyAcc, row)
    specialtyMap.set(specialtyId, specialtyAcc)
  }

  for (const row of avaliacoes) {
    const unitAcc = unitMap.get(row.unidade_ubt_id)
    if (unitAcc) accumulateAvaliacao(unitAcc, row)

    const specialtyKey = row.especialidade_nome
    const specialtyAcc =
      specialtyMap.get(specialtyKey) ?? emptyAccumulator(specialtyKey, specialtyKey)
    accumulateAvaliacao(specialtyAcc, row)
    specialtyMap.set(specialtyKey, specialtyAcc)
  }

  const unitRows = units
    .map((unit) => toEntityRow(unitMap.get(unit.id) ?? emptyAccumulator(unit.id, unit.name), 'unit'))
    .filter((row): row is UnidadesCriticasEntityRowDto => row != null)
    .sort((a, b) => b.issueCount - a.issueCount)

  const specialtyRows = [...specialtyMap.values()]
    .map((acc) => toEntityRow(acc, 'specialty'))
    .filter((row): row is UnidadesCriticasEntityRowDto => row != null)
    .sort((a, b) => b.issueCount - a.issueCount)

  return { unitRows, specialtyRows }
}

function countCritical(entities: UnidadesCriticasEntityRowDto[]) {
  return entities.filter((entity) => entity.severity === 'critical').length
}

function buildHighlights(
  unitRows: UnidadesCriticasEntityRowDto[],
  specialtyRows: UnidadesCriticasEntityRowDto[],
): UnidadesCriticasHighlightDto[] {
  const criticalUnit = unitRows.find((row) => row.severity === 'critical') ?? unitRows[0]
  const criticalSpecialty = specialtyRows.find((row) => row.severity === 'critical') ?? specialtyRows[0]

  return [
    {
      id: 'critical-units',
      title: 'Unidades críticas',
      subtitle: `${formatNumber(unitRows.filter((row) => row.severity === 'critical').length)} UBTs abaixo dos parâmetros mínimos`,
      tone: 'red',
      severity: 'critical',
    },
    {
      id: 'warning-units',
      title: 'Unidades em atenção',
      subtitle: `${formatNumber(unitRows.filter((row) => row.severity === 'warning').length)} UBTs com alertas de qualidade`,
      tone: 'amber',
      severity: 'warning',
    },
    {
      id: 'top-critical-unit',
      title: 'UBT prioritária para plano de ação',
      subtitle: criticalUnit
        ? `${criticalUnit.name} · ${formatNumber(criticalUnit.issueCount)} indicadores fora da meta`
        : 'Nenhuma unidade crítica no período',
      tone: 'red',
      severity: 'critical',
    },
    {
      id: 'top-critical-specialty',
      title: 'Especialidade prioritária',
      subtitle: criticalSpecialty
        ? `${criticalSpecialty.name} · ${formatNumber(criticalSpecialty.issueCount)} indicadores fora da meta`
        : 'Nenhuma especialidade crítica no período',
      tone: 'amber',
      severity: 'warning',
    },
  ]
}

function buildCriticalEvolution(
  units: RedeUnitApi[],
  consultas: QualityConsultaRow[],
  avaliacoes: QualityAvaliacaoRow[],
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
) {
  const dates = new Set<string>()
  for (const row of consultas) {
    dates.add(row.finalizada_em?.slice(0, 10) ?? row.criado_em.slice(0, 10))
  }
  for (const row of avaliacoes) {
    dates.add(row.avaliado_em.slice(0, 10))
  }

  const criticalByDate = new Map<string, number>()

  for (const date of dates) {
    const dayConsultas = consultas.filter(
      (row) => (row.finalizada_em?.slice(0, 10) ?? row.criado_em.slice(0, 10)) === date,
    )
    const dayAvaliacoes = avaliacoes.filter((row) => row.avaliado_em.slice(0, 10) === date)
    const { unitRows } = aggregateEntities(units, dayConsultas, dayAvaliacoes)
    criticalByDate.set(date, countCritical(unitRows))
  }

  return buildEvolutionSeries(criticalByDate, periodStart, periodEnd, monthly)
}

function buildKpis(summary: UnidadesCriticasReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Unidades críticas',
      value: formatNumber(summary.criticalUnitsCount),
      footer: `${formatNumber(summary.warningUnitsCount)} em atenção no recorte`,
      footerTone: summary.criticalUnitsCount > 0 ? 'muted' : 'positive',
      topBar: 'from-red-400 to-rose-500',
    },
    {
      label: 'Especialidades críticas',
      value: formatNumber(summary.criticalSpecialtiesCount),
      footer: `${formatNumber(summary.specialtiesAnalyzed)} especialidades analisadas`,
      footerTone: 'neutral',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'UBTs analisadas',
      value: formatNumber(summary.unitsAnalyzed),
      footer: 'Unidades com volume mínimo para avaliação',
      footerTone: 'neutral',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Variação de críticos',
      value:
        summary.criticalDeltaCount === 0
          ? 'Estável'
          : `${summary.criticalDeltaCount > 0 ? '+' : ''}${formatNumber(summary.criticalDeltaCount)}`,
      footer: 'Unidades críticas vs período anterior',
      footerTone: summary.criticalDeltaCount <= 0 ? 'positive' : 'muted',
      footerIcon: summary.criticalDeltaCount <= 0 ? 'down' : 'up',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getUnidadesCriticasReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<UnidadesCriticasReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [currentConsultas, previousConsultas, currentAvaliacoes, previousAvaliacoes] =
    await Promise.all([
      loadQualityConsultasInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
      loadQualityConsultasInPeriod(
        entidadeId,
        unitIds,
        previous.previousStart,
        previous.previousEnd,
      ),
      loadQualityAvaliacoesInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
      loadQualityAvaliacoesInPeriod(
        entidadeId,
        unitIds,
        previous.previousStart,
        previous.previousEnd,
      ),
    ])

  const current = aggregateEntities(visibleUnits, currentConsultas, currentAvaliacoes)
  const prev = aggregateEntities(visibleUnits, previousConsultas, previousAvaliacoes)

  const currentCriticalTotal =
    countCritical(current.unitRows) + countCritical(current.specialtyRows)
  const previousCriticalTotal =
    countCritical(prev.unitRows) + countCritical(prev.specialtyRows)

  const summary = {
    criticalUnitsCount: countCritical(current.unitRows),
    criticalSpecialtiesCount: countCritical(current.specialtyRows),
    warningUnitsCount: current.unitRows.filter((row) => row.severity === 'warning').length,
    unitsAnalyzed: visibleUnits.length,
    specialtiesAnalyzed: new Set(
      currentConsultas.map((row) => String(row.especialidade_id)),
    ).size,
    criticalDeltaCount: currentCriticalTotal - previousCriticalTotal,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'unidades-criticas',
    title: 'Unidades críticas',
    description:
      'UBTs ou especialidades abaixo dos parâmetros mínimos de qualidade e que exigem plano de ação.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(current.unitRows, current.specialtyRows),
    units: current.unitRows,
    specialties: current.specialtyRows,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      criticalCountPoints: buildCriticalEvolution(
        visibleUnits,
        currentConsultas,
        currentAvaliacoes,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
    thresholds: {
      minCompletionRatePercent: QUALITY_THRESHOLDS.minCompletionRatePercent,
      minAvgRating: QUALITY_THRESHOLDS.minAvgRating,
      maxInterruptionRatePercent: QUALITY_THRESHOLDS.maxInterruptionRatePercent,
      minNps: QUALITY_THRESHOLDS.minNps,
      maxAvgDurationMinutes: QUALITY_THRESHOLDS.maxAvgDurationMinutes,
      minAvgDurationMinutes: QUALITY_THRESHOLDS.minAvgDurationMinutes,
    },
  }
}
