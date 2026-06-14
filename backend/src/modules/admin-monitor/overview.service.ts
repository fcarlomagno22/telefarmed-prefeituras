import { supabaseAdmin } from '../../db/supabase.js'
import { fetchUnitsMetrics, type UnitMetrics } from '../prefeitura-rede/metrics.service.js'
import { loadAdminMonitorCatalog, loadAdminMonitorEntidades } from './catalog.service.js'
import {
  bucketTimelineHour,
  formatTimeAgo,
  resolveAdminMonitorPeriod,
  TIMELINE_SLOT_HOURS,
} from './period.js'
import type {
  AdminMonitorCatalogUnit,
  AdminMonitorOverviewDto,
  AdminMonitorTimelinePeriod,
} from './types.js'

type ConsultaRow = {
  unidade_ubt_id: string
  entidade_contratante_id: string
  status: string
  criado_em: string
  iniciada_em: string | null
  finalizada_em: string | null
}

type LiveConsultaRow = {
  id: string
  entidade_contratante_id: string
  unidade_ubt_id: string
  status: string
  iniciada_em: string | null
  criado_em: string
  paciente_nome: string
  especialidade_nome: string
  profissional_nome: string | null
  unidade_nome: string
}

type FilaRow = {
  unidade_ubt_id: string
  status: string
  chegada_em: string
}

const EMPTY_METRICS: UnitMetrics = {
  operatorsOnline: 0,
  stationsActive: 0,
  consultationsCompleted: 0,
  consultationsInProgress: 0,
  cancellationsToday: 0,
  avgConsultationMinutes: 0,
  queueNow: 0,
  consultationsToday: 0,
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

function normalizeRegionFilter(regionKey: string): string | null {
  const key = regionKey.trim().toLowerCase()
  if (!key || key === 'all' || key === 'todos') return null
  return regionKey.trim()
}

function normalizeEntidadeFilter(entidadeId: string): string | null {
  const id = entidadeId.trim()
  if (!id || id === 'all') return null
  return id
}

function mapStatusLabel(status: AdminMonitorCatalogUnit['status']): string {
  if (status === 'ativa') return 'Online'
  if (status === 'manutencao') return 'Manutenção'
  return 'Offline'
}

function resolveSla(unit: AdminMonitorCatalogUnit, queue: number): 'normal' | 'atencao' | 'critico' {
  if (unit.stationsOnline <= 0 || unit.status === 'inativa') return 'critico'
  if (queue >= 5 || unit.status === 'manutencao') return 'atencao'
  if (unit.stationsOnline < unit.stationsTotal) return 'atencao'
  return 'normal'
}

function resolvePerformance(sla: 'normal' | 'atencao' | 'critico'): string {
  if (sla === 'normal') return 'Ótima'
  if (sla === 'atencao') return 'Estável'
  return 'Crítica'
}

function formatInicio(iso: string | null, fallback: string): string {
  const value = iso ?? fallback
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function mapLiveStatus(status: string): string {
  if (status === 'em_andamento') return 'Em atendimento'
  if (status === 'aguardando_medico') return 'Aguardando médico'
  return status
}

function filterUnits(
  units: AdminMonitorCatalogUnit[],
  entidadeId: string | null,
  regionKey: string | null,
): AdminMonitorCatalogUnit[] {
  return units.filter((unit) => {
    if (entidadeId && unit.entidadeId !== entidadeId) return false
    if (regionKey && unit.regionKey !== regionKey) return false
    return true
  })
}

async function loadMetricsByEntidade(
  units: AdminMonitorCatalogUnit[],
): Promise<Map<string, UnitMetrics>> {
  const merged = new Map<string, UnitMetrics>()
  const byEntidade = new Map<string, AdminMonitorCatalogUnit[]>()

  for (const unit of units) {
    const bucket = byEntidade.get(unit.entidadeId) ?? []
    bucket.push(unit)
    byEntidade.set(unit.entidadeId, bucket)
  }

  await Promise.all(
    [...byEntidade.entries()].map(async ([entidadeId, entidadeUnits]) => {
      const unitIds = entidadeUnits.map((unit) => unit.id)
      const stationsOnlineByUnit = new Map(
        entidadeUnits.map((unit) => [unit.id, unit.stationsOnline]),
      )
      const metricsMap = await fetchUnitsMetrics(entidadeId, unitIds, stationsOnlineByUnit)
      for (const [unitId, metrics] of metricsMap) {
        merged.set(unitId, metrics)
      }
    }),
  )

  return merged
}

async function loadConsultasInPeriod(
  unitIds: string[],
  entidadeId: string | null,
  startIso: string,
  endIso: string,
): Promise<ConsultaRow[]> {
  if (unitIds.length === 0) return []

  let query = supabaseAdmin
    .from('consultas')
    .select('unidade_ubt_id, entidade_contratante_id, status, criado_em, iniciada_em, finalizada_em')
    .in('unidade_ubt_id', unitIds)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (entidadeId) query = query.eq('entidade_contratante_id', entidadeId)

  const { data, error } = await query
  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return (data ?? []) as ConsultaRow[]
}

async function loadLiveConsultas(
  unitIds: string[],
  entidadeId: string | null,
  unitById: Map<string, AdminMonitorCatalogUnit>,
  entidadeNames: Map<string, string>,
): Promise<AdminMonitorOverviewDto['consultasLive']> {
  if (unitIds.length === 0) return []

  let query = supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'id, entidade_contratante_id, unidade_ubt_id, status, iniciada_em, criado_em, paciente_nome, especialidade_nome, profissional_nome, unidade_nome',
    )
    .in('unidade_ubt_id', unitIds)
    .in('status', ['em_andamento', 'aguardando_medico'])
    .order('iniciada_em', { ascending: true, nullsFirst: false })
    .limit(100)

  if (entidadeId) query = query.eq('entidade_contratante_id', entidadeId)

  const { data, error } = await query
  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return ((data ?? []) as LiveConsultaRow[]).map((row) => {
    const unit = unitById.get(String(row.unidade_ubt_id))
    return {
      id: String(row.id),
      prefeitura:
        unit?.prefeituraNome ??
        entidadeNames.get(String(row.entidade_contratante_id)) ??
        'Prefeitura',
      ubt: row.unidade_nome || unit?.name || 'UBT',
      paciente: row.paciente_nome?.trim() || 'Paciente',
      especialidade: row.especialidade_nome?.trim() || '—',
      medico: row.profissional_nome?.trim() || 'Profissional de plantão',
      inicio: formatInicio(row.iniciada_em, row.criado_em),
      status: mapLiveStatus(String(row.status)),
    }
  })
}

async function loadNoShowCount(unitIds: string[], startIso: string): Promise<number> {
  if (unitIds.length === 0) return 0

  const [filaResult, cancelResult] = await Promise.all([
    supabaseAdmin
      .from('fila_espera')
      .select('id', { count: 'exact', head: true })
      .in('unidade_ubt_id', unitIds)
      .eq('status', 'desistiu')
      .gte('chegada_em', startIso),
    supabaseAdmin
      .from('consultas')
      .select('id', { count: 'exact', head: true })
      .in('unidade_ubt_id', unitIds)
      .eq('status', 'cancelada')
      .gte('criado_em', startIso),
  ])

  if (filaResult.error) throwUnlessMissingRelation(filaResult.error)
  if (cancelResult.error) throwUnlessMissingRelation(cancelResult.error)

  return (filaResult.count ?? 0) + (cancelResult.count ?? 0)
}

async function loadPreviousQueueAverage(
  unitIds: string[],
  startIso: string,
  endIso: string,
): Promise<number> {
  if (unitIds.length === 0) return 0

  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('unidade_ubt_id, status, chegada_em')
    .in('unidade_ubt_id', unitIds)
    .gte('chegada_em', startIso)
    .lte('chegada_em', endIso)

  if (error) {
    throwUnlessMissingRelation(error)
    return 0
  }

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as FilaRow[]) {
    if (row.status !== 'aguardando' && row.status !== 'chamado') continue
    const unitId = String(row.unidade_ubt_id)
    counts.set(unitId, (counts.get(unitId) ?? 0) + 1)
  }

  if (counts.size === 0) return 0
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0)
  return Math.round(total / counts.size)
}

function buildTimeline(consultas: ConsultaRow[]): AdminMonitorOverviewDto['timeline'] {
  const buckets = TIMELINE_SLOT_HOURS.map((hour) => ({
    hora: `${String(hour).padStart(2, '0')}:00`,
    emCurso: 0,
    concluidas: 0,
    aguardando: 0,
  }))

  for (const row of consultas) {
    const bucketIndex = bucketTimelineHour(row.iniciada_em ?? row.criado_em)
    if (bucketIndex == null) continue
    const bucket = buckets[bucketIndex]
    if (!bucket) continue

    const status = String(row.status)
    if (status === 'concluida') bucket.concluidas += 1
    else if (status === 'em_andamento') bucket.emCurso += 1
    else if (status === 'aguardando_medico') bucket.aguardando += 1
  }

  return buckets
}

function buildHeatmap(
  units: AdminMonitorCatalogUnit[],
  metricsMap: Map<string, UnitMetrics>,
): AdminMonitorOverviewDto['heatmap'] {
  const regionBuckets = new Map<string, number[]>()

  for (const unit of units) {
    const region = unit.region?.trim() || 'Sem região'
    const metrics = metricsMap.get(unit.id) ?? EMPTY_METRICS
    const ocupacao =
      unit.stationsTotal > 0
        ? Math.min(100, Math.round((metrics.consultationsInProgress / unit.stationsTotal) * 100))
        : 0

    const slots = regionBuckets.get(region) ?? Array.from({ length: 6 }, () => 0)
    for (let index = 0; index < slots.length; index += 1) {
      slots[index] = Math.min(100, Math.round((slots[index]! + ocupacao) / 2))
    }
    regionBuckets.set(region, slots)
  }

  return [...regionBuckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([regiao, slots]) => ({ regiao, slots }))
}

function buildAlerts(
  units: AdminMonitorCatalogUnit[],
  metricsMap: Map<string, UnitMetrics>,
): AdminMonitorOverviewDto['alerts'] {
  const alerts: AdminMonitorOverviewDto['alerts'] = []

  for (const unit of units) {
    const metrics = metricsMap.get(unit.id) ?? EMPTY_METRICS
    const sla = resolveSla(unit, metrics.queueNow)

    if (unit.stationsOnline <= 0) {
      alerts.push({
        id: `offline-${unit.id}`,
        title: 'Unidade offline',
        municipality: unit.prefeituraNome,
        unit: unit.name,
        severity: 'critical',
        timeAgo: 'agora',
        category: 'Conectividade',
        description: 'Sem terminais online para atendimento.',
      })
      continue
    }

    if (metrics.queueNow >= 5) {
      alerts.push({
        id: `queue-${unit.id}`,
        title: 'Fila em atenção',
        municipality: unit.prefeituraNome,
        unit: unit.name,
        severity: sla === 'critico' ? 'critical' : 'warning',
        timeAgo: formatTimeAgo(new Date().toISOString()),
        category: 'Fila',
        description: `${metrics.queueNow} pacientes aguardando atendimento.`,
      })
    } else if (unit.status === 'manutencao') {
      alerts.push({
        id: `maint-${unit.id}`,
        title: 'Unidade em manutenção',
        municipality: unit.prefeituraNome,
        unit: unit.name,
        severity: 'warning',
        timeAgo: 'agora',
        category: 'Infraestrutura',
        description: 'Capacidade reduzida por manutenção de terminais.',
      })
    }
  }

  return alerts
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1))
    .slice(0, 20)
}

export async function getAdminMonitorOverview(params: {
  entidadeId: string
  regionKey: string
  timelinePeriod: AdminMonitorTimelinePeriod
}): Promise<AdminMonitorOverviewDto> {
  const entidadeFilter = normalizeEntidadeFilter(params.entidadeId)
  const regionFilter = normalizeRegionFilter(params.regionKey)
  const period = resolveAdminMonitorPeriod(params.timelinePeriod)

  const [allUnits, entidades] = await Promise.all([
    loadAdminMonitorCatalog(),
    loadAdminMonitorEntidades(),
  ])

  const entidadeNames = new Map(entidades.map((item) => [item.id, item.nome]))
  const filteredUnits = filterUnits(allUnits, entidadeFilter, regionFilter)
  const unitIds = filteredUnits.map((unit) => unit.id)
  const unitById = new Map(filteredUnits.map((unit) => [unit.id, unit]))

  const [metricsMap, periodConsultas, _previousConsultas, consultasLive, noShowHoje, previousQueueAvg] =
    await Promise.all([
      loadMetricsByEntidade(filteredUnits),
      loadConsultasInPeriod(unitIds, entidadeFilter, period.startIso, period.endIso),
      loadConsultasInPeriod(
        unitIds,
        entidadeFilter,
        period.previousStartIso,
        period.previousEndIso,
      ),
      loadLiveConsultas(unitIds, entidadeFilter, unitById, entidadeNames),
      loadNoShowCount(unitIds, period.startIso),
      loadPreviousQueueAverage(unitIds, period.previousStartIso, period.previousEndIso),
    ])

  const unitRows = filteredUnits.map((unit) => {
    const metrics = metricsMap.get(unit.id) ?? EMPTY_METRICS
    const sla = resolveSla(unit, metrics.queueNow)
    const ocupacao =
      unit.stationsTotal > 0
        ? Math.min(100, Math.round((metrics.consultationsInProgress / unit.stationsTotal) * 100))
        : 0

    return {
      id: unit.id,
      prefeituraId: unit.entidadeId,
      prefeitura: unit.prefeituraNome,
      ubt: unit.name,
      regiao: unit.region,
      regionKey: unit.regionKey,
      status: mapStatusLabel(unit.status),
      emCurso: metrics.consultationsInProgress,
      fila: metrics.queueNow,
      tempoMedio:
        metrics.avgConsultationMinutes > 0 ? `${metrics.avgConsultationMinutes} min` : '—',
      operador: unit.operatorName,
      terminal: `${unit.stationsOnline}/${unit.stationsTotal}`,
      ocupacao,
      sla,
    }
  })

  const rankingUbts = [...unitRows]
    .sort((a, b) => b.emCurso + b.fila - (a.emCurso + a.fila))
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      nome: row.ubt,
      municipio: row.prefeitura,
      municipioId: row.prefeituraId,
      hoje: row.emCurso + (metricsMap.get(row.id)?.consultationsCompleted ?? 0),
      ocupacao: row.ocupacao,
      performance: resolvePerformance(row.sla),
    }))

  const municipioAgg = new Map<
    string,
    { id: string; nome: string; uf: string; hoje: number; fila: number; ocupacaoSum: number; count: number }
  >()

  for (const row of unitRows) {
    const unit = unitById.get(row.id)
    const current = municipioAgg.get(row.prefeituraId) ?? {
      id: row.prefeituraId,
      nome: row.prefeitura,
      uf: unit?.uf ?? '—',
      hoje: 0,
      fila: 0,
      ocupacaoSum: 0,
      count: 0,
    }
    const metrics = metricsMap.get(row.id) ?? EMPTY_METRICS
    current.hoje += metrics.consultationsToday
    current.fila += row.fila
    current.ocupacaoSum += row.ocupacao
    current.count += 1
    municipioAgg.set(row.prefeituraId, current)
  }

  const rankingMunicipios = [...municipioAgg.values()]
    .map((row) => ({
      id: row.id,
      nome: row.nome,
      uf: row.uf,
      hoje: row.hoje,
      fila: row.fila,
      ocupacao: row.count > 0 ? Math.round(row.ocupacaoSum / row.count) : 0,
    }))
    .sort((a, b) => b.hoje - a.hoje)
    .slice(0, 12)

  const filaTotal = unitRows.reduce((sum, row) => sum + row.fila, 0)
  const filaMedia = unitRows.length > 0 ? Math.round(filaTotal / unitRows.length) : 0
  const currentQueueAvg = filaMedia
  const trend =
    previousQueueAvg <= 0
      ? currentQueueAvg > 0
        ? '+100% vs período anterior'
        : '—'
      : `${currentQueueAvg >= previousQueueAvg ? '+' : ''}${Math.round(((currentQueueAvg - previousQueueAvg) / previousQueueAvg) * 100)}% vs período anterior`

  const totalConsultasPeriodo = periodConsultas.length
  const noShowTaxa =
    totalConsultasPeriodo > 0
      ? `${((noShowHoje / totalConsultasPeriodo) * 100).toFixed(1).replace('.', ',')}%`
      : '0%'

  const criticalQueues = unitRows.filter((row) => row.fila >= 5).length
  const avgOcupacao =
    unitRows.length > 0
      ? Math.round(unitRows.reduce((sum, row) => sum + row.ocupacao, 0) / unitRows.length)
      : 0

  const regions = new Map<string, string>()
  for (const unit of allUnits) {
    if (unit.regionKey) regions.set(unit.regionKey, unit.region)
  }

  return {
    filterKey: `${params.entidadeId}:${params.regionKey}:${params.timelinePeriod}`,
    unitRows,
    consultasLive,
    timeline: buildTimeline(periodConsultas),
    rankingUbts,
    rankingMunicipios,
    heatmap: buildHeatmap(filteredUnits, metricsMap),
    alerts: buildAlerts(filteredUnits, metricsMap),
    queueSnapshot: {
      filaMedia,
      filaMediaTrend: trend,
      noShowHoje,
      noShowTaxa,
    },
    filterOptions: {
      municipios: [{ value: 'all', label: 'Todas as prefeituras' }].concat(
        entidades.map((item) => ({ value: item.id, label: item.nome })),
      ),
      regions: [{ value: 'todos', label: 'Todas as regiões' }].concat(
        [...regions.entries()]
          .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
          .map(([value, label]) => ({ value, label })),
      ),
      timelinePeriod: [
        { value: 'dia', label: 'Hoje' },
        { value: '24h', label: 'Últimas 24h' },
        { value: '7d', label: 'Últimos 7 dias' },
      ],
    },
    kpis: [
      {
        key: 'ubts',
        label: 'UBTs ativas',
        value: String(unitRows.length),
        suffix: 'na rede',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        key: 'em_curso',
        label: 'Consultas em curso',
        value: String(unitRows.reduce((sum, row) => sum + row.emCurso, 0)),
        suffix: 'atendimentos',
        topBar: 'from-emerald-400 to-green-500',
      },
      {
        key: 'aguardando',
        label: 'Pacientes aguardando',
        value: String(filaTotal),
        suffix: 'na fila',
        topBar: 'from-amber-400 to-orange-500',
      },
      {
        key: 'filas_criticas',
        label: 'Filas críticas',
        value: String(criticalQueues),
        suffix: 'unidades',
        topBar: 'from-rose-400 to-red-500',
      },
      {
        key: 'sla_ocupacao',
        label: 'SLA/Ocupação',
        value: `${avgOcupacao}%`,
        suffix: 'média',
        topBar: 'from-violet-400 to-purple-500',
      },
      {
        key: 'no_show',
        label: 'No-show',
        value: String(noShowHoje),
        suffix: 'no período',
        topBar: 'from-amber-400 to-yellow-500',
      },
    ],
  }
}
