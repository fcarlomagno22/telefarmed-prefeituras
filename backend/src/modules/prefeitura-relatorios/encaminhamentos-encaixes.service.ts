import { supabaseAdmin } from '../../db/supabase.js'
import { fetchAgendaRowsForPeriod } from '../prefeitura-agendas/query.service.js'
import type { AgendaAggregateRow } from '../prefeitura-agendas/types.js'
import {
  buildDailySeries,
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { periodBounds, resolvePreviousPeriod, spDateKey } from '../prefeitura-consultas/period.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { loadFilaRowsWithSpecialty, type FilaSpecialtyRow } from './demand-data.service.js'
import {
  buildMonthlyEvolutionSeries,
  conversionPercent,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  isMissingRelationError,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  EncaminhamentosEncaixesBreakdownRowDto,
  EncaminhamentosEncaixesHighlightDto,
  EncaminhamentosEncaixesReportDto,
  EncaminhamentosEncaixesReportUnitRowDto,
} from './types.js'

type ConsultaFlowRow = {
  unidade_ubt_id: string
  status: string
  fila_espera_id: string | null
  agenda_consulta_id: string | null
}

type UnitFlowCounts = {
  encaixes: number
  retornos: number
  consultasRegulares: number
  espontaneos: number
  encaminhamentosFila: number
}

function emptyUnitCounts(): UnitFlowCounts {
  return {
    encaixes: 0,
    retornos: 0,
    consultasRegulares: 0,
    espontaneos: 0,
    encaminhamentosFila: 0,
  }
}

async function loadConsultasFlowRows(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<ConsultaFlowRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select('unidade_ubt_id, status, fila_espera_id, agenda_consulta_id')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as ConsultaFlowRow[]
}

function buildConsultaLookup(consultas: ConsultaFlowRow[]) {
  const byFilaId = new Map<string, ConsultaFlowRow>()
  const byAgendaId = new Map<string, ConsultaFlowRow>()

  for (const row of consultas) {
    if (row.fila_espera_id) byFilaId.set(String(row.fila_espera_id), row)
    if (row.agenda_consulta_id) byAgendaId.set(String(row.agenda_consulta_id), row)
  }

  return { byFilaId, byAgendaId }
}

function isReferredConsulta(row: ConsultaFlowRow) {
  const status = String(row.status)
  return (
    status === 'aguardando_medico' ||
    status === 'em_andamento' ||
    status === 'concluida'
  )
}

function isCompletedConsulta(row: ConsultaFlowRow) {
  return String(row.status) === 'concluida'
}

function resolveConsultaForFila(
  row: FilaSpecialtyRow,
  lookup: ReturnType<typeof buildConsultaLookup>,
): ConsultaFlowRow | null {
  return (
    lookup.byFilaId.get(String(row.id)) ??
    (row.agenda_consulta_id
      ? (lookup.byAgendaId.get(String(row.agenda_consulta_id)) ?? null)
      : null)
  )
}

function accumulateAgenda(
  unitMap: Map<string, UnitFlowCounts>,
  totals: UnitFlowCounts,
  row: AgendaAggregateRow,
) {
  const unitId = String(row.unidade_ubt_id)
  const unit = unitMap.get(unitId) ?? emptyUnitCounts()
  const tipo = String(row.tipo)

  if (tipo === 'encaixe') {
    unit.encaixes += 1
    totals.encaixes += 1
  } else if (tipo === 'retorno') {
    unit.retornos += 1
    totals.retornos += 1
  } else {
    unit.consultasRegulares += 1
    totals.consultasRegulares += 1
  }

  if (row.origem === 'espontaneo') {
    unit.espontaneos += 1
    totals.espontaneos += 1
  }

  unitMap.set(unitId, unit)
}

function accumulateFilaReferrals(
  unitMap: Map<string, UnitFlowCounts>,
  totals: UnitFlowCounts,
  filaRows: FilaSpecialtyRow[],
  consultas: ConsultaFlowRow[],
) {
  const lookup = buildConsultaLookup(consultas)
  const referredByUnit = new Map<string, Set<string>>()

  for (const row of filaRows) {
    const consulta = resolveConsultaForFila(row, lookup)
    if (!consulta || !isReferredConsulta(consulta)) continue

    const unitId = String(row.unidade_ubt_id)
    const seen = referredByUnit.get(unitId) ?? new Set<string>()
    if (seen.has(String(row.id))) continue
    seen.add(String(row.id))
    referredByUnit.set(unitId, seen)

    const unit = unitMap.get(unitId) ?? emptyUnitCounts()
    unit.encaminhamentosFila += 1
    totals.encaminhamentosFila += 1
    unitMap.set(unitId, unit)
  }
}

function aggregatePeriod(
  units: RedeUnitApi[],
  agendaRows: AgendaAggregateRow[],
  filaRows: FilaSpecialtyRow[],
  consultas: ConsultaFlowRow[],
) {
  const unitMap = new Map<string, UnitFlowCounts>()
  const totals = emptyUnitCounts()

  for (const unit of units) {
    unitMap.set(unit.id, emptyUnitCounts())
  }

  for (const row of agendaRows) accumulateAgenda(unitMap, totals, row)
  accumulateFilaReferrals(unitMap, totals, filaRows, consultas)

  const totalNonRegular =
    totals.encaixes +
    totals.retornos +
    totals.espontaneos +
    totals.encaminhamentosFila

  return { unitMap, totals, totalNonRegular }
}

function buildBreakdown(
  totals: UnitFlowCounts,
  filaRows: FilaSpecialtyRow[],
  consultas: ConsultaFlowRow[],
  totalNonRegular: number,
): EncaminhamentosEncaixesBreakdownRowDto[] {
  const lookup = buildConsultaLookup(consultas)
  let referredCompleted = 0
  let referredTotal = 0

  for (const row of filaRows) {
    const consulta = resolveConsultaForFila(row, lookup)
    if (!consulta || !isReferredConsulta(consulta)) continue
    referredTotal += 1
    if (isCompletedConsulta(consulta)) referredCompleted += 1
  }

  const rows: EncaminhamentosEncaixesBreakdownRowDto[] = [
    {
      key: 'encaixe',
      label: 'Encaixes',
      count: totals.encaixes,
      sharePercent: conversionPercent(totals.encaixes, totalNonRegular),
      completionRatePercent: 0,
    },
    {
      key: 'retorno',
      label: 'Retornos',
      count: totals.retornos,
      sharePercent: conversionPercent(totals.retornos, totalNonRegular),
      completionRatePercent: 0,
    },
    {
      key: 'consulta',
      label: 'Consultas regulares',
      count: totals.consultasRegulares,
      sharePercent: conversionPercent(totals.consultasRegulares, totalNonRegular),
      completionRatePercent: 0,
    },
    {
      key: 'espontaneo',
      label: 'Origem espontânea',
      count: totals.espontaneos,
      sharePercent: conversionPercent(totals.espontaneos, totalNonRegular),
      completionRatePercent: 0,
    },
    {
      key: 'encaminhamento_fila',
      label: 'Encaminhamentos da fila',
      count: totals.encaminhamentosFila,
      sharePercent: conversionPercent(totals.encaminhamentosFila, totalNonRegular),
      completionRatePercent: conversionPercent(referredCompleted, referredTotal),
    },
  ]

  return rows.sort((a, b) => b.count - a.count)
}

function buildUnitRows(
  units: RedeUnitApi[],
  unitMap: Map<string, UnitFlowCounts>,
  networkTotal: number,
): EncaminhamentosEncaixesReportUnitRowDto[] {
  return units
    .map((unit) => {
      const counts = unitMap.get(unit.id) ?? emptyUnitCounts()
      const totalNonRegular =
        counts.encaixes +
        counts.retornos +
        counts.espontaneos +
        counts.encaminhamentosFila

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        encaixes: counts.encaixes,
        retornos: counts.retornos,
        consultasRegulares: counts.consultasRegulares,
        espontaneos: counts.espontaneos,
        encaminhamentosFila: counts.encaminhamentosFila,
        totalNonRegular,
        sharePercent: conversionPercent(totalNonRegular, networkTotal),
      }
    })
    .sort((a, b) => b.totalNonRegular - a.totalNonRegular)
}

function buildHighlights(
  units: EncaminhamentosEncaixesReportUnitRowDto[],
  breakdown: EncaminhamentosEncaixesBreakdownRowDto[],
): EncaminhamentosEncaixesHighlightDto[] {
  if (units.length === 0) return []

  const topUnit = units[0]
  const topEncaixes = [...units].sort((a, b) => b.encaixes - a.encaixes)[0]
  const topEspontaneos = [...units].sort((a, b) => b.espontaneos - a.espontaneos)[0]
  const topBreakdown = breakdown.filter((row) => row.key !== 'consulta')[0]

  return [
    {
      id: 'top-non-regular',
      title: 'Maior volume fora do fluxo regular',
      subtitle: `${topUnit?.name ?? '—'} · ${formatNumber(topUnit?.totalNonRegular ?? 0)} registros`,
      tone: 'blue',
    },
    {
      id: 'top-encaixes',
      title: 'Mais encaixes realizados',
      subtitle: `${topEncaixes?.name ?? '—'} · ${formatNumber(topEncaixes?.encaixes ?? 0)} encaixes`,
      tone: 'amber',
    },
    {
      id: 'top-espontaneo',
      title: 'Mais demanda espontânea',
      subtitle: `${topEspontaneos?.name ?? '—'} · ${formatNumber(topEspontaneos?.espontaneos ?? 0)} chegadas`,
      tone: 'green',
    },
    {
      id: 'top-breakdown',
      title: 'Principal tipo de fluxo',
      subtitle: `${topBreakdown?.label ?? '—'} · ${formatNumber(topBreakdown?.count ?? 0)} registros`,
      tone: 'red',
    },
  ]
}

function buildDailyCounts(agendaRows: AgendaAggregateRow[], filaRows: FilaSpecialtyRow[]) {
  const totalByDate = new Map<string, number>()
  const encaixeByDate = new Map<string, number>()
  const espontaneoByDate = new Map<string, number>()

  for (const row of agendaRows) {
    const date = String(row.data)
    totalByDate.set(date, (totalByDate.get(date) ?? 0) + 1)
    if (String(row.tipo) === 'encaixe') {
      encaixeByDate.set(date, (encaixeByDate.get(date) ?? 0) + 1)
    }
    if (row.origem === 'espontaneo') {
      espontaneoByDate.set(date, (espontaneoByDate.get(date) ?? 0) + 1)
    }
  }

  for (const row of filaRows) {
    if (row.origem !== 'espontaneo') continue
    const date = spDateKey(row.chegada_em)
    totalByDate.set(date, (totalByDate.get(date) ?? 0) + 1)
    espontaneoByDate.set(date, (espontaneoByDate.get(date) ?? 0) + 1)
  }

  return { totalByDate, encaixeByDate, espontaneoByDate }
}

function buildEvolutionPoints(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
) {
  return monthly
    ? buildMonthlyEvolutionSeries(dailyCounts, periodStart, periodEnd)
    : buildDailySeries(dailyCounts, periodStart, periodEnd)
}

function buildKpis(summary: EncaminhamentosEncaixesReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Fluxos não regulares',
      value: formatNumber(summary.totalNonRegular),
      footer:
        summary.totalDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.totalDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.totalDeltaPercent)}% vs período anterior`,
      footerTone: summary.totalDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.totalDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Encaixes',
      value: formatNumber(summary.encaixes),
      footer: 'Consultas incluídas fora da grade regular',
      footerTone: 'neutral',
      topBar: 'from-amber-400 to-yellow-500',
    },
    {
      label: 'Origem espontânea',
      value: formatNumber(summary.espontaneos),
      footer: 'Agendamentos ou chegadas sem horário prévio',
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Encaminhamentos da fila',
      value: formatNumber(summary.encaminhamentosFila),
      footer: 'Pacientes encaminhados à teleconsulta após triagem',
      footerTone: 'neutral',
      topBar: 'from-indigo-400 to-blue-600',
    },
    {
      label: 'Retornos',
      value: formatNumber(summary.retornos),
      footer: 'Consultas de retorno registradas na agenda',
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getEncaminhamentosEncaixesReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<EncaminhamentosEncaixesReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previousPeriod = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [
    currentAgenda,
    previousAgenda,
    currentFila,
    previousFila,
    currentConsultas,
    previousConsultas,
  ] = await Promise.all([
    fetchAgendaRowsForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchAgendaRowsForPeriod(
      entidadeId,
      previousPeriod.previousStart,
      previousPeriod.previousEnd,
      unitIds,
    ),
    loadFilaRowsWithSpecialty(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadFilaRowsWithSpecialty(
      entidadeId,
      unitIds,
      previousPeriod.previousStart,
      previousPeriod.previousEnd,
    ),
    loadConsultasFlowRows(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadConsultasFlowRows(
      entidadeId,
      unitIds,
      previousPeriod.previousStart,
      previousPeriod.previousEnd,
    ),
  ])

  const current = aggregatePeriod(visibleUnits, currentAgenda, currentFila, currentConsultas)
  const previousMetrics = aggregatePeriod(
    visibleUnits,
    previousAgenda,
    previousFila,
    previousConsultas,
  )

  const breakdown = buildBreakdown(
    current.totals,
    currentFila,
    currentConsultas,
    current.totalNonRegular,
  )
  const units = buildUnitRows(visibleUnits, current.unitMap, current.totalNonRegular)

  const summary = {
    totalNonRegular: current.totalNonRegular,
    encaixes: current.totals.encaixes,
    retornos: current.totals.retornos,
    consultasRegulares: current.totals.consultasRegulares,
    espontaneos: current.totals.espontaneos,
    encaminhamentosFila: current.totals.encaminhamentosFila,
    unitsCount: visibleUnits.length,
    totalDeltaPercent: computeDeltaPercent(
      current.totalNonRegular,
      previousMetrics.totalNonRegular,
    ),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const { totalByDate, encaixeByDate, espontaneoByDate } = buildDailyCounts(
    currentAgenda,
    currentFila,
  )

  return {
    reportId: 'encaminhamentos-encaixes',
    title: 'Encaminhamentos e encaixes',
    description:
      'Volume de encaixes, encaminhamentos internos e consultas fora do fluxo regular da agenda.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(units, breakdown),
    breakdown,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      volumePoints: buildEvolutionPoints(
        totalByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
      encaixePoints: buildEvolutionPoints(
        encaixeByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
      espontaneoPoints: buildEvolutionPoints(
        espontaneoByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
