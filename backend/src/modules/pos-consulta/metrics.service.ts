import { supabaseAdmin } from '../../db/supabase.js'
import { resolveEntidadeContractStatus, type DashboardEntidadeRow } from '../admin-dashboard/catalog.service.js'
import { stateKeyFromUf } from '../admin-dashboard/formatters.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'

type PeriodKey = 'hoje' | '7d' | '30d'

type MetricsPlanRow = {
  id: string
  consulta_id: string
  entidade_contratante_id: string
  status: string
  inicio_em: string
  fim_em: string
}

type MetricsCheckinRow = {
  id: string
  plano_id: string
  status: string
  enviado_em: string | null
  respondido_em: string | null
}

type MetricsRespostaRow = {
  evolucao: 'melhorou' | 'igual' | 'piorou' | null
  criado_em: string
  pos_consulta_checkins: { plano_id: string } | Array<{ plano_id: string }>
}

type PrefeituraMetricsParams = {
  entidadeContratanteId: string
  period: PeriodKey
  regionKey: string
  unidadeUbtId?: string
}

type AdminMetricsParams = {
  period: PeriodKey
  state: string
  city: string
  contract: 'all' | 'active' | 'expiring' | 'suspended'
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function resolvePeriodStart(period: PeriodKey): Date {
  const now = new Date()
  if (period === 'hoje') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
}

function inPeriod(iso: string | null | undefined, start: Date): boolean {
  if (!iso) return false
  return new Date(iso).getTime() >= start.getTime()
}

function buildEvolucaoDistribuicao(counts: { melhorou: number; igual: number; piorou: number }) {
  const total = counts.melhorou + counts.igual + counts.piorou
  if (total === 0) return []

  return [
    { key: 'melhorou' as const, label: 'Melhorou', count: counts.melhorou },
    { key: 'igual' as const, label: 'Estável', count: counts.igual },
    { key: 'piorou' as const, label: 'Piorou', count: counts.piorou },
  ].map((item) => ({
    ...item,
    percent: Math.round((item.count / total) * 100),
  }))
}

function buildKpis(input: {
  acompanhamentosAtivos: number
  checkinsEnviados: number
  checkinsRespondidos: number
  evolucaoCounts: { melhorou: number; igual: number; piorou: number }
}) {
  const taxaAdesaoPercent =
    input.checkinsEnviados > 0
      ? Math.round((input.checkinsRespondidos / input.checkinsEnviados) * 100)
      : 0
  const evolucaoTotal =
    input.evolucaoCounts.melhorou + input.evolucaoCounts.igual + input.evolucaoCounts.piorou
  const taxaMelhoraPercent =
    evolucaoTotal > 0
      ? Math.round((input.evolucaoCounts.melhorou / evolucaoTotal) * 100)
      : 0

  return {
    acompanhamentosAtivos: input.acompanhamentosAtivos,
    taxaAdesaoPercent,
    checkinsRespondidos: input.checkinsRespondidos,
    checkinsEnviados: input.checkinsEnviados,
    totalCheckinsRealizados: input.checkinsRespondidos,
    checkinsPendentes: Math.max(0, input.checkinsEnviados - input.checkinsRespondidos),
    taxaMelhoraPercent,
  }
}

async function loadScopedConsultaIdsForPrefeitura(
  entidadeId: string,
  regionKey: string,
  unidadeUbtId?: string,
): Promise<Set<string> | null> {
  if (unidadeUbtId) {
    const { data, error } = await supabaseAdmin
      .from('consultas')
      .select('id')
      .eq('entidade_contratante_id', entidadeId)
      .eq('unidade_ubt_id', unidadeUbtId)
    if (error) throw error
    return new Set((data ?? []).map((row) => String(row.id)))
  }

  if (regionKey !== 'todas') {
    const units = await listRedeUnits(entidadeId)
    const unitIds = units.filter((unit) => unit.regionKey === regionKey).map((unit) => unit.id)
    if (unitIds.length === 0) return new Set()
    const { data, error } = await supabaseAdmin
      .from('consultas')
      .select('id')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
    if (error) throw error
    return new Set((data ?? []).map((row) => String(row.id)))
  }

  return null
}

async function loadMetricsBundle(entidadeIds: string[] | null) {
  let planQuery = supabaseAdmin
    .from('pos_consulta_planos')
    .select('id, consulta_id, entidade_contratante_id, status, inicio_em, fim_em')

  if (entidadeIds && entidadeIds.length > 0) {
    planQuery = planQuery.in('entidade_contratante_id', entidadeIds)
  } else if (entidadeIds && entidadeIds.length === 0) {
    return { plans: [] as MetricsPlanRow[], checkins: [] as MetricsCheckinRow[], respostas: [] as MetricsRespostaRow[] }
  }

  const { data: plans, error: plansError } = await planQuery
  if (plansError) throw plansError

  const planRows = (plans ?? []) as MetricsPlanRow[]
  const planIds = planRows.map((row) => row.id)
  if (planIds.length === 0) {
    return { plans: [], checkins: [], respostas: [] }
  }

  const [checkinsResult, respostasResult] = await Promise.all([
    supabaseAdmin
      .from('pos_consulta_checkins')
      .select('id, plano_id, status, enviado_em, respondido_em')
      .in('plano_id', planIds),
    supabaseAdmin
      .from('pos_consulta_respostas')
      .select('evolucao, criado_em, pos_consulta_checkins!inner ( plano_id )')
      .in(
        'checkin_id',
        (
          await supabaseAdmin.from('pos_consulta_checkins').select('id').in('plano_id', planIds)
        ).data?.map((row) => row.id) ?? [],
      ),
  ])

  if (checkinsResult.error) throw checkinsResult.error
  if (respostasResult.error) throw respostasResult.error

  return {
    plans: planRows,
    checkins: (checkinsResult.data ?? []) as MetricsCheckinRow[],
    respostas: (respostasResult.data ?? []) as MetricsRespostaRow[],
  }
}

function aggregateMetrics(
  plans: MetricsPlanRow[],
  checkins: MetricsCheckinRow[],
  respostas: MetricsRespostaRow[],
  period: PeriodKey,
  consultaFilter?: Set<string> | null,
) {
  const periodStart = resolvePeriodStart(period)
  const now = Date.now()

  const scopedPlans = plans.filter((plan) => {
    if (consultaFilter && !consultaFilter.has(plan.consulta_id)) return false
    return true
  })

  const planIdSet = new Set(scopedPlans.map((plan) => plan.id))
  const scopedCheckins = checkins.filter((checkin) => planIdSet.has(checkin.plano_id))
  const scopedRespostas = respostas.filter((resposta) => {
    const join = unwrapOne(resposta.pos_consulta_checkins)
    return join ? planIdSet.has(join.plano_id) : false
  })

  const acompanhamentosAtivos = scopedPlans.filter(
    (plan) => plan.status === 'ativo' && new Date(plan.fim_em).getTime() >= now,
  ).length

  const checkinsEnviados = scopedCheckins.filter(
    (checkin) =>
      checkin.status !== 'pendente' &&
      (inPeriod(checkin.enviado_em, periodStart) || inPeriod(checkin.respondido_em, periodStart)),
  ).length

  const checkinsRespondidos = scopedCheckins.filter(
    (checkin) => checkin.status === 'respondido' && inPeriod(checkin.respondido_em, periodStart),
  ).length

  const evolucaoCounts = { melhorou: 0, igual: 0, piorou: 0 }
  for (const resposta of scopedRespostas) {
    if (!inPeriod(resposta.criado_em, periodStart) || !resposta.evolucao) continue
    evolucaoCounts[resposta.evolucao] += 1
  }

  const kpis = buildKpis({
    acompanhamentosAtivos,
    checkinsEnviados,
    checkinsRespondidos,
    evolucaoCounts,
  })

  return {
    kpis,
    evolucaoDistribuicao: buildEvolucaoDistribuicao(evolucaoCounts),
    isEmpty: kpis.acompanhamentosAtivos === 0 && kpis.checkinsEnviados === 0,
  }
}

export async function getPrefeituraPosConsultaMetrics(params: PrefeituraMetricsParams) {
  const consultaFilter = await loadScopedConsultaIdsForPrefeitura(
    params.entidadeContratanteId,
    params.regionKey,
    params.unidadeUbtId,
  )

  const { plans, checkins, respostas } = await loadMetricsBundle([params.entidadeContratanteId])
  const aggregated = aggregateMetrics(plans, checkins, respostas, params.period, consultaFilter)
  const filterKey = `${params.period}-${params.regionKey}-${params.unidadeUbtId ?? 'todas'}`

  return {
    ...aggregated,
    filterKey,
  }
}

async function loadAdminEntidades(): Promise<
  Array<{
    id: string
    name: string
    stateUf: string
    stateKey: string
    contractStatus: 'active' | 'expiring' | 'suspended'
  }>
> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id, nome_exibicao, municipio, uf, status_cliente')

  if (error) throw error

  const entidadeIds = (data ?? []).map((row) => String(row.id))
  const { data: contratos, error: contratosError } = await supabaseAdmin
    .from('contratos_entidade')
    .select('entidade_contratante_id, status, data_encerramento')
    .in('entidade_contratante_id', entidadeIds.length > 0 ? entidadeIds : ['00000000-0000-0000-0000-000000000000'])

  if (contratosError) throw contratosError

  const contratoByEntidade = new Map<string, { status: string; data_encerramento: string | null }>()
  for (const row of contratos ?? []) {
    contratoByEntidade.set(String(row.entidade_contratante_id), {
      status: String(row.status),
      data_encerramento: row.data_encerramento ? String(row.data_encerramento) : null,
    })
  }

  return (data ?? []).map((row) => {
    const entidade: DashboardEntidadeRow = {
      id: String(row.id),
      name: String(row.nome_exibicao ?? row.municipio),
      state: String(row.uf),
      stateKey: stateKeyFromUf(String(row.uf)),
      statusCliente: String(row.status_cliente),
    }
    const contratoRaw = contratoByEntidade.get(entidade.id) ?? null
    const contratos = contratoRaw
      ? [
          {
            id: '',
            entidadeId: entidade.id,
            status: contratoRaw.status,
            dataAssinatura: '',
            dataEncerramento: contratoRaw.data_encerramento,
            consultasContratadas: 0,
            consultasRealizadas: 0,
            percentualUtilizado: 0,
          },
        ]
      : []
    return {
      id: entidade.id,
      name: entidade.name,
      stateUf: entidade.state,
      stateKey: entidade.stateKey,
      contractStatus: resolveEntidadeContractStatus(entidade, contratos),
    }
  })
}

function filterAdminEntidades(
  entidades: Awaited<ReturnType<typeof loadAdminEntidades>>,
  params: AdminMetricsParams,
) {
  return entidades.filter((entidade) => {
    if (params.state !== 'all' && entidade.stateKey !== params.state) return false
    if (params.city !== 'all' && entidade.id !== params.city) return false
    if (params.contract !== 'all' && entidade.contractStatus !== params.contract) return false
    return true
  })
}

export async function getAdminPosConsultaMetrics(params: AdminMetricsParams) {
  const entidades = filterAdminEntidades(await loadAdminEntidades(), params)
  const entidadeIds = entidades.map((row) => row.id)

  const { plans, checkins, respostas } = await loadMetricsBundle(entidadeIds)
  const aggregated = aggregateMetrics(plans, checkins, respostas, params.period, null)

  const clientesBreakdown = entidades
    .map((entidade) => {
      const scoped = aggregateMetrics(
        plans.filter((plan) => plan.entidade_contratante_id === entidade.id),
        checkins,
        respostas,
        params.period,
        null,
      )
      return {
        clientId: entidade.id,
        municipalityName: entidade.name,
        stateUf: entidade.stateUf,
        acompanhamentosAtivos: scoped.kpis.acompanhamentosAtivos,
        taxaAdesaoPercent: scoped.kpis.taxaAdesaoPercent,
        checkinsRealizados: scoped.kpis.totalCheckinsRealizados,
        taxaMelhoraPercent: scoped.kpis.taxaMelhoraPercent,
      }
    })
    .filter((row) => row.acompanhamentosAtivos > 0 || row.checkinsRealizados > 0)
    .sort((a, b) => b.acompanhamentosAtivos - a.acompanhamentosAtivos)

  const filterKey = `${params.period}-${params.state}-${params.city}-${params.contract}`

  return {
    ...aggregated,
    clientesBreakdown,
    filterKey,
  }
}
