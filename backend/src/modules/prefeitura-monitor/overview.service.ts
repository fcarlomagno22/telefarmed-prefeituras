import { supabaseAdmin } from '../../db/supabase.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import { fetchUnitsMetrics } from '../prefeitura-rede/metrics.service.js'
import { bucketConsultationHour, resolveMonitorPeriod, TIMELINE_COLORS } from './period.js'
import type {
  MonitorComparisonRow,
  MonitorComparisonTab,
  MonitorLiveGridRow,
  MonitorOngoingServiceRow,
  MonitorTimelineSeries,
  TimelinePeriod,
  UnitRankingMetrics,
} from './types.js'

type ConsultaPeriodRow = {
  unidade_ubt_id: string
  status: string
  criado_em: string
  iniciada_em: string | null
  finalizada_em: string | null
}

type FilaWaitRow = {
  unidade_ubt_id: string
  status: string
  chegada_em: string
  atendimento_inicio_em: string | null
}

type AvaliacaoRow = {
  nota: number | null
  nota_teleconsulta: number | null
  consultas: { unidade_ubt_id: string; criado_em: string } | { unidade_ubt_id: string; criado_em: string }[] | null
}

type OngoingRow = {
  id: string
  unidade_ubt_id: string
  status: string
  iniciada_em: string | null
  criado_em: string
  paciente_nome: string
  paciente_data_nascimento: string | null
  especialidade_nome: string
  profissional_nome: string | null
  unidade_nome: string
}

function isMissingRelationError(error: unknown): boolean {
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

function throwUnlessMissingRelation(error: unknown): void {
  if (!error) return
  if (!isMissingRelationError(error)) throw error
}

function filterUnitsByRegion(units: RedeUnitApi[], regionKey: string): RedeUnitApi[] {
  const active = units.filter((unit) => unit.status !== 'inativa')
  if (regionKey === 'todas') return active
  return active.filter((unit) => unit.regionKey === regionKey)
}

function emptyRankingMetrics(unit: RedeUnitApi): UnitRankingMetrics {
  return {
    unitId: unit.id,
    unitName: unit.name,
    completed: 0,
    cancelled: 0,
    abandoned: 0,
    avgWaitMinutes: 0,
    avgRating: 0,
    ratingCount: 0,
  }
}

function computeAge(birthDate: string | null): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return 0

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  return Math.max(0, age)
}

function formatStartedAgo(iso: string | null, fallbackIso: string): string {
  const reference = iso ? Date.parse(iso) : Date.parse(fallbackIso)
  if (!Number.isFinite(reference)) return '—'

  const minutes = Math.max(1, Math.round((Date.now() - reference) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}h ${rest} min` : `${hours}h`
}

function variationPercent(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 100)
}

function primaryMaxForTab(tab: MonitorComparisonTab, values: number[]): number {
  const peak = values.length > 0 ? Math.max(...values) : 0
  if (tab === 'produtividade') return Math.max(120, Math.ceil(peak * 1.15))
  if (tab === 'abandono') return Math.max(30, Math.ceil(peak * 1.15))
  if (tab === 'espera') return Math.max(35, Math.ceil(peak * 1.15))
  return 5
}

function primaryValueForTab(tab: MonitorComparisonTab, metrics: UnitRankingMetrics): number {
  if (tab === 'produtividade') return metrics.completed
  if (tab === 'abandono') {
    const total = metrics.completed + metrics.cancelled + metrics.abandoned
    if (total <= 0) return 0
    return Math.round(((metrics.cancelled + metrics.abandoned) / total) * 100)
  }
  if (tab === 'espera') return Math.round(metrics.avgWaitMinutes)
  return metrics.ratingCount > 0 ? Math.round(metrics.avgRating * 10) / 10 : 0
}

function buildRankingRows(
  tab: MonitorComparisonTab,
  current: Map<string, UnitRankingMetrics>,
  previous: Map<string, UnitRankingMetrics>,
  units: RedeUnitApi[],
): MonitorComparisonRow[] {
  const values = units.map((unit) => primaryValueForTab(tab, current.get(unit.id) ?? emptyRankingMetrics(unit)))
  const max = primaryMaxForTab(tab, values)

  return units
    .map((unit) => {
      const currentMetrics = current.get(unit.id) ?? emptyRankingMetrics(unit)
      const previousMetrics = previous.get(unit.id) ?? emptyRankingMetrics(unit)
      const primaryValue = primaryValueForTab(tab, currentMetrics)
      const previousValue = primaryValueForTab(tab, previousMetrics)

      return {
        position: 0,
        unitName: unit.name,
        primaryValue,
        primaryMax: max,
        variationPercent: variationPercent(primaryValue, previousValue),
      }
    })
    .sort((a, b) => b.primaryValue - a.primaryValue)
    .map((row, index) => ({ ...row, position: index + 1 }))
}

async function loadConsultasInPeriod(
  entidadeId: string,
  unitIds: string[],
  startIso: string,
  endIso: string,
): Promise<ConsultaPeriodRow[]> {
  if (unitIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('unidade_ubt_id, status, criado_em, iniciada_em, finalizada_em')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return (data ?? []) as ConsultaPeriodRow[]
}

async function loadFilaWaitRows(
  entidadeId: string,
  unitIds: string[],
  startIso: string,
  endIso: string,
): Promise<FilaWaitRow[]> {
  if (unitIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('unidade_ubt_id, status, chegada_em, atendimento_inicio_em')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('chegada_em', startIso)
    .lte('chegada_em', endIso)
    .in('status', ['finalizado', 'desistiu'])

  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return (data ?? []) as FilaWaitRow[]
}

async function loadAvaliacoesInPeriod(
  entidadeId: string,
  unitIds: string[],
  startIso: string,
  endIso: string,
): Promise<AvaliacaoRow[]> {
  if (unitIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('consulta_avaliacoes')
    .select('nota, nota_teleconsulta, consultas!inner(unidade_ubt_id, criado_em, entidade_contratante_id)')
    .eq('consultas.entidade_contratante_id', entidadeId)
    .in('consultas.unidade_ubt_id', unitIds)
    .gte('consultas.criado_em', startIso)
    .lte('consultas.criado_em', endIso)

  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return (data ?? []) as AvaliacaoRow[]
}

function buildRankingMetricsMap(
  units: RedeUnitApi[],
  consultas: ConsultaPeriodRow[],
  filaRows: FilaWaitRow[],
  avaliacoes: AvaliacaoRow[],
): Map<string, UnitRankingMetrics> {
  const metrics = new Map<string, UnitRankingMetrics>()
  for (const unit of units) {
    metrics.set(unit.id, emptyRankingMetrics(unit))
  }

  for (const row of consultas) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    const status = String(row.status)
    if (status === 'concluida') current.completed += 1
    else if (status === 'cancelada' || status === 'interrompida') current.cancelled += 1
  }

  const waitTotals = new Map<string, { sum: number; count: number }>()
  for (const row of filaRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    if (row.status === 'desistiu') {
      current.abandoned += 1
    }

    if (row.atendimento_inicio_em) {
      const waitMinutes = Math.max(
        0,
        Math.round(
          (Date.parse(String(row.atendimento_inicio_em)) - Date.parse(String(row.chegada_em))) /
            60_000,
        ),
      )
      const bucket = waitTotals.get(unitId) ?? { sum: 0, count: 0 }
      bucket.sum += waitMinutes
      bucket.count += 1
      waitTotals.set(unitId, bucket)
    }
  }

  for (const [unitId, bucket] of waitTotals) {
    const current = metrics.get(unitId)
    if (!current || bucket.count <= 0) continue
    current.avgWaitMinutes = Math.round(bucket.sum / bucket.count)
  }

  const ratingTotals = new Map<string, { sum: number; count: number }>()
  for (const row of avaliacoes) {
    const consulta = Array.isArray(row.consultas) ? row.consultas[0] : row.consultas
    if (!consulta) continue

    const unitId = String(consulta.unidade_ubt_id)
    const score =
      typeof row.nota_teleconsulta === 'number'
        ? row.nota_teleconsulta
        : typeof row.nota === 'number'
          ? row.nota
          : null
    if (score == null) continue

    const bucket = ratingTotals.get(unitId) ?? { sum: 0, count: 0 }
    bucket.sum += score
    bucket.count += 1
    ratingTotals.set(unitId, bucket)
  }

  for (const [unitId, bucket] of ratingTotals) {
    const current = metrics.get(unitId)
    if (!current || bucket.count <= 0) continue
    current.ratingCount = bucket.count
    current.avgRating = bucket.sum / bucket.count
  }

  return metrics
}

export async function buildLiveGrid(
  entidadeId: string,
  units: RedeUnitApi[],
): Promise<MonitorLiveGridRow[]> {
  if (units.length === 0) return []

  const unitIds = units.map((unit) => unit.id)
  const stationsOnlineByUnit = new Map(units.map((unit) => [unit.id, unit.stationsOnline]))
  const metricsMap = await fetchUnitsMetrics(entidadeId, unitIds, stationsOnlineByUnit)

  return units.map((unit) => {
    const metrics = metricsMap.get(unit.id)
    const stationsOnline = unit.stationsOnline
    const inConsultation = metrics?.consultationsInProgress ?? 0
    const queuePatients = metrics?.queueNow ?? 0
    const busyStations = Math.min(
      stationsOnline,
      Math.max(inConsultation, queuePatients > 0 ? 1 : 0),
    )
    const freeStations = Math.max(0, stationsOnline - busyStations)

    return {
      id: unit.id,
      name: unit.name,
      regionKey: unit.regionKey,
      freeStations,
      busyStations,
      queuePatients,
      inConsultation,
      status: unit.status === 'manutencao' ? 'manutencao' : 'ativa',
    }
  })
}

export function buildTimelineSeries(
  units: RedeUnitApi[],
  consultas: ConsultaPeriodRow[],
): MonitorTimelineSeries[] {
  const topUnits = units.slice(0, 6)
  const bucketSize = 6

  return topUnits.map((unit, index) => {
    const values = Array.from({ length: bucketSize }, () => 0)

    for (const row of consultas) {
      if (String(row.unidade_ubt_id) !== unit.id) continue
      const bucketIndex = bucketConsultationHour(row.iniciada_em ?? row.criado_em)
      if (bucketIndex == null) continue
      values[bucketIndex] = (values[bucketIndex] ?? 0) + 1
    }

    return {
      unitId: unit.id,
      unitName: unit.name,
      color: TIMELINE_COLORS[index % TIMELINE_COLORS.length]!,
      values,
    }
  })
}

async function loadOngoingServices(
  entidadeId: string,
  unitIds: string[],
  queueByUnit: Map<string, number>,
): Promise<MonitorOngoingServiceRow[]> {
  if (unitIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'id, unidade_ubt_id, status, iniciada_em, criado_em, paciente_nome, paciente_data_nascimento, especialidade_nome, profissional_nome, unidade_nome',
    )
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .in('status', ['em_andamento', 'aguardando_medico'])
    .order('iniciada_em', { ascending: true, nullsFirst: false })
    .limit(50)

  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return ((data ?? []) as OngoingRow[]).map((row, index) => ({
    id: String(row.id),
    unitRoom: `${row.unidade_nome} · Sala ${(index % 3) + 1}`,
    startedAgo: formatStartedAgo(row.iniciada_em, row.criado_em),
    patientName: row.paciente_nome || 'Paciente',
    specialty: row.especialidade_nome || '—',
    age: computeAge(row.paciente_data_nascimento),
    professional: row.profissional_nome?.trim() || 'Profissional de plantão',
    queue: queueByUnit.get(String(row.unidade_ubt_id)) ?? 0,
  }))
}

export async function getPrefeituraMonitorOverview(
  entidadeId: string,
  allUnits: RedeUnitApi[],
  params: { regionKey: string; timelinePeriod: TimelinePeriod },
) {
  const units = filterUnitsByRegion(allUnits, params.regionKey)
  const unitIds = units.map((unit) => unit.id)
  const period = resolveMonitorPeriod(params.timelinePeriod)

  const [
    currentConsultas,
    previousConsultas,
    currentFila,
    previousFila,
    currentAvaliacoes,
    previousAvaliacoes,
    liveGrid,
  ] = await Promise.all([
    loadConsultasInPeriod(entidadeId, unitIds, period.startIso, period.endIso),
    loadConsultasInPeriod(entidadeId, unitIds, period.previousStartIso, period.previousEndIso),
    loadFilaWaitRows(entidadeId, unitIds, period.startIso, period.endIso),
    loadFilaWaitRows(entidadeId, unitIds, period.previousStartIso, period.previousEndIso),
    loadAvaliacoesInPeriod(entidadeId, unitIds, period.startIso, period.endIso),
    loadAvaliacoesInPeriod(entidadeId, unitIds, period.previousStartIso, period.previousEndIso),
    buildLiveGrid(entidadeId, units),
  ])

  const currentMetrics = buildRankingMetricsMap(units, currentConsultas, currentFila, currentAvaliacoes)
  const previousMetrics = buildRankingMetricsMap(
    units,
    previousConsultas,
    previousFila,
    previousAvaliacoes,
  )

  const rankingByTab: Record<MonitorComparisonTab, MonitorComparisonRow[]> = {
    produtividade: buildRankingRows('produtividade', currentMetrics, previousMetrics, units),
    abandono: buildRankingRows('abandono', currentMetrics, previousMetrics, units),
    espera: buildRankingRows('espera', currentMetrics, previousMetrics, units),
    avaliacao: buildRankingRows('avaliacao', currentMetrics, previousMetrics, units),
  }

  const queueByUnit = new Map(liveGrid.map((row) => [row.id, row.queuePatients]))
  const ongoingServices = await loadOngoingServices(entidadeId, unitIds, queueByUnit)

  const regions = new Map<string, string>()
  for (const unit of allUnits.filter((item) => item.status !== 'inativa')) {
    if (unit.regionKey) regions.set(unit.regionKey, unit.region)
  }

  const unitsByActivity = [...units].sort((a, b) => {
    const countFor = (unitId: string) =>
      currentConsultas.filter((row) => String(row.unidade_ubt_id) === unitId).length
    return countFor(b.id) - countFor(a.id)
  })

  return {
    liveGrid,
    timelineHours: ['08h', '10h', '12h', '14h', '16h', '18h'],
    timelineSeries: buildTimelineSeries(unitsByActivity, currentConsultas),
    rankingByTab,
    ongoingServices,
    filterOptions: {
      region: [
        { value: 'todas', label: 'Todas as regiões' },
        ...[...regions.entries()]
          .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
          .map(([value, label]) => ({ value, label })),
      ],
      timelinePeriod: [
        { value: 'hoje', label: 'Hoje' },
        { value: 'ontem', label: 'Ontem' },
        { value: 'semana', label: 'Esta semana' },
      ],
    },
  }
}

export async function getPrefeituraMonitorRanking(
  entidadeId: string,
  allUnits: RedeUnitApi[],
  params: { tab: MonitorComparisonTab; regionKey: string; timelinePeriod: TimelinePeriod },
): Promise<MonitorComparisonRow[]> {
  const overview = await getPrefeituraMonitorOverview(entidadeId, allUnits, params)
  return overview.rankingByTab[params.tab]
}
