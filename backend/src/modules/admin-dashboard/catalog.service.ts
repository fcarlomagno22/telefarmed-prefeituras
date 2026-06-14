import { supabaseAdmin } from '../../db/supabase.js'
import {
  computeStationsOnline,
  normalizeMaintenanceIndexes,
} from '../prefeitura-rede/formatters.js'
import type { UnidadeUbtRow } from '../prefeitura-rede/types.js'
import { getMonthlyCycle } from '../prefeitura-contrato/cycle.js'
import { daysUntilDate, stateKeyFromUf } from './formatters.js'

const ENTIDADE_SELECT =
  'id, nome_exibicao, municipio, uf, status_cliente'

const CONTRATO_SELECT =
  'id, entidade_contratante_id, status, data_assinatura, data_encerramento, consultas_contratadas, consultas_realizadas, percentual_utilizado'

const UNIT_SELECT =
  'id, entidade_contratante_id, terminais_total, terminais_manutencao, estado_operacional, status'

export type DashboardEntidadeRow = {
  id: string
  name: string
  state: string
  stateKey: string
  statusCliente: string
}

export type DashboardContratoRow = {
  id: string
  entidadeId: string
  status: string
  dataAssinatura: string
  dataEncerramento: string | null
  consultasContratadas: number
  consultasRealizadas: number
  percentualUtilizado: number
}

export type DashboardUnitRow = {
  id: string
  entidadeId: string
  stationsTotal: number
  stationsOnline: number
  maintenanceCount: number
  status: string
}

export type DashboardCatalog = {
  entidades: DashboardEntidadeRow[]
  contratosByEntidade: Map<string, DashboardContratoRow[]>
  unitsByEntidade: Map<string, DashboardUnitRow[]>
  monthCycle: ReturnType<typeof getMonthlyCycle>
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

function mapContractStatus(
  entidade: DashboardEntidadeRow,
  contrato: DashboardContratoRow | null,
): 'active' | 'expiring' | 'suspended' {
  if (entidade.statusCliente === 'suspensa' || contrato?.status === 'suspenso') return 'suspended'
  if (entidade.statusCliente === 'implantacao' || entidade.statusCliente === 'prospect') {
    return 'expiring'
  }
  const days = daysUntilDate(contrato?.dataEncerramento ?? null)
  if (days != null && days >= 0 && days <= 90) return 'expiring'
  return 'active'
}

export function resolveEntidadeContractStatus(
  entidade: DashboardEntidadeRow,
  contratos: DashboardContratoRow[],
): 'active' | 'expiring' | 'suspended' {
  const active = contratos.find((item) => item.status === 'ativo') ?? null
  return mapContractStatus(entidade, active)
}

export async function loadAdminDashboardCatalog(): Promise<DashboardCatalog> {
  const monthCycle = getMonthlyCycle()

  const [entidadesResult, contratosResult, unitsResult] = await Promise.all([
    supabaseAdmin
      .from('entidades_contratantes')
      .select(ENTIDADE_SELECT)
      .in('status_cliente', ['ativa', 'implantacao', 'prospect', 'suspensa'])
      .order('nome_exibicao', { ascending: true }),
    supabaseAdmin
      .from('contratos_entidade')
      .select(CONTRATO_SELECT)
      .in('status', ['ativo', 'suspenso', 'implantacao']),
    supabaseAdmin
      .from('unidades_ubt')
      .select(UNIT_SELECT)
      .neq('estado_operacional', 'inativa'),
  ])

  if (entidadesResult.error) throw entidadesResult.error
  if (contratosResult.error) throwUnlessMissingRelation(contratosResult.error)
  if (unitsResult.error) throwUnlessMissingRelation(unitsResult.error)

  const entidades: DashboardEntidadeRow[] = ((entidadesResult.data ?? []) as Array<{
    id: string
    nome_exibicao: string
    municipio: string
    uf: string
    status_cliente: string
  }>).map((row) => ({
    id: row.id,
    name: row.nome_exibicao?.trim() || row.municipio || 'Prefeitura',
    state: row.uf?.trim() || '—',
    stateKey: stateKeyFromUf(row.uf ?? ''),
    statusCliente: row.status_cliente,
  }))

  const contratosByEntidade = new Map<string, DashboardContratoRow[]>()
  for (const row of (contratosResult.data ?? []) as Array<{
    id: string
    entidade_contratante_id: string
    status: string
    data_assinatura: string
    data_encerramento: string | null
    consultas_contratadas: number | null
    consultas_realizadas: number
    percentual_utilizado: number | string | null
  }>) {
    const bucket = contratosByEntidade.get(row.entidade_contratante_id) ?? []
    bucket.push({
      id: row.id,
      entidadeId: row.entidade_contratante_id,
      status: row.status,
      dataAssinatura: row.data_assinatura,
      dataEncerramento: row.data_encerramento,
      consultasContratadas: row.consultas_contratadas ?? 0,
      consultasRealizadas: row.consultas_realizadas ?? 0,
      percentualUtilizado: Number(row.percentual_utilizado ?? 0),
    })
    contratosByEntidade.set(row.entidade_contratante_id, bucket)
  }

  const unitsByEntidade = new Map<string, DashboardUnitRow[]>()
  for (const row of (unitsResult.data ?? []) as UnidadeUbtRow[]) {
    const maintenanceIndexes = normalizeMaintenanceIndexes(
      row.terminais_manutencao,
      row.terminais_total,
    )
    const stationsOnline = computeStationsOnline(
      row.terminais_total,
      maintenanceIndexes,
      row.estado_operacional,
    )
    const bucket = unitsByEntidade.get(row.entidade_contratante_id) ?? []
    bucket.push({
      id: row.id,
      entidadeId: row.entidade_contratante_id,
      stationsTotal: row.terminais_total,
      stationsOnline,
      maintenanceCount: maintenanceIndexes.length,
      status: row.estado_operacional,
    })
    unitsByEntidade.set(row.entidade_contratante_id, bucket)
  }

  return {
    entidades,
    contratosByEntidade,
    unitsByEntidade,
    monthCycle,
  }
}

export async function loadConsultasMetrics(
  entidadeIds: string[],
  periodStartIso: string,
  periodEndIso: string,
  monthStartIso: string,
  monthEndIso: string,
): Promise<{
  periodCountByEntidade: Map<string, number>
  monthCountByEntidade: Map<string, number>
  hourlyCounts: Map<number, number>
  avgSlaByEntidade: Map<string, number>
}> {
  const periodCountByEntidade = new Map<string, number>()
  const monthCountByEntidade = new Map<string, number>()
  const hourlyCounts = new Map<number, number>()
  const durationSumByEntidade = new Map<string, number>()
  const durationCountByEntidade = new Map<string, number>()

  if (entidadeIds.length === 0) {
    return {
      periodCountByEntidade,
      monthCountByEntidade,
      hourlyCounts,
      avgSlaByEntidade: new Map(),
    }
  }

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('entidade_contratante_id, criado_em, status, duracao_minutos')
    .in('entidade_contratante_id', entidadeIds)
    .gte('criado_em', monthStartIso)
    .lte('criado_em', periodEndIso)
    .in('status', ['concluida', 'em_andamento', 'aguardando_medico', 'cancelada'])

  if (error) {
    throwUnlessMissingRelation(error)
    return {
      periodCountByEntidade,
      monthCountByEntidade,
      hourlyCounts,
      avgSlaByEntidade: new Map(),
    }
  }

  const periodStart = Date.parse(periodStartIso)

  for (const row of (data ?? []) as Array<{
    entidade_contratante_id: string
    criado_em: string
    status: string
    duracao_minutos: number | null
  }>) {
    const entidadeId = String(row.entidade_contratante_id)
    const createdAt = Date.parse(row.criado_em)
    if (Number.isNaN(createdAt)) continue

    if (createdAt >= Date.parse(monthStartIso) && createdAt <= Date.parse(monthEndIso)) {
      monthCountByEntidade.set(entidadeId, (monthCountByEntidade.get(entidadeId) ?? 0) + 1)
    }

    if (createdAt >= periodStart && createdAt <= Date.parse(periodEndIso)) {
      periodCountByEntidade.set(entidadeId, (periodCountByEntidade.get(entidadeId) ?? 0) + 1)

      const hour = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false,
      }).format(new Date(row.criado_em))
      const hourNumber = Number.parseInt(hour, 10)
      if (Number.isFinite(hourNumber) && hourNumber >= 7 && hourNumber <= 18) {
        hourlyCounts.set(hourNumber, (hourlyCounts.get(hourNumber) ?? 0) + 1)
      }
    }

    if (row.status === 'concluida' && row.duracao_minutos != null && row.duracao_minutos > 0) {
      durationSumByEntidade.set(
        entidadeId,
        (durationSumByEntidade.get(entidadeId) ?? 0) + row.duracao_minutos,
      )
      durationCountByEntidade.set(entidadeId, (durationCountByEntidade.get(entidadeId) ?? 0) + 1)
    }
  }

  const avgSlaByEntidade = new Map<string, number>()
  for (const [entidadeId, total] of durationSumByEntidade) {
    const count = durationCountByEntidade.get(entidadeId) ?? 0
    if (count > 0) avgSlaByEntidade.set(entidadeId, Math.round(total / count))
  }

  return {
    periodCountByEntidade,
    monthCountByEntidade,
    hourlyCounts,
    avgSlaByEntidade,
  }
}

export async function loadRevenueByEntidade(
  contratoIds: string[],
  competenciaMes: string,
): Promise<Map<string, { package: number; avulso: number }>> {
  const revenueByEntidade = new Map<string, { package: number; avulso: number }>()
  if (contratoIds.length === 0) return revenueByEntidade

  const { data, error } = await supabaseAdmin
    .from('fechamentos_competencia')
    .select('contrato_id, valor_base_centavos, valor_excedente_centavos')
    .in('contrato_id', contratoIds)
    .eq('competencia_mes', competenciaMes)

  if (error) {
    throwUnlessMissingRelation(error)
    return revenueByEntidade
  }

  const contratoEntidade = new Map<string, string>()
  const { data: contratos, error: contratosError } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id, entidade_contratante_id')
    .in('id', contratoIds)

  if (contratosError) {
    throwUnlessMissingRelation(contratosError)
    return revenueByEntidade
  }

  for (const row of (contratos ?? []) as Array<{ id: string; entidade_contratante_id: string }>) {
    contratoEntidade.set(row.id, row.entidade_contratante_id)
  }

  for (const row of (data ?? []) as Array<{
    contrato_id: string
    valor_base_centavos: number
    valor_excedente_centavos: number
  }>) {
    const entidadeId = contratoEntidade.get(String(row.contrato_id))
    if (!entidadeId) continue
    const current = revenueByEntidade.get(entidadeId) ?? { package: 0, avulso: 0 }
    current.package += Number(row.valor_base_centavos ?? 0)
    current.avulso += Number(row.valor_excedente_centavos ?? 0)
    revenueByEntidade.set(entidadeId, current)
  }

  return revenueByEntidade
}

export async function loadQueueByUnit(unitIds: string[]): Promise<Map<string, number>> {
  const queueByUnit = new Map<string, number>()
  if (unitIds.length === 0) return queueByUnit

  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('unidade_ubt_id, status')
    .in('unidade_ubt_id', unitIds)
    .in('status', ['aguardando', 'chamado'])

  if (error) {
    throwUnlessMissingRelation(error)
    return queueByUnit
  }

  for (const row of (data ?? []) as Array<{ unidade_ubt_id: string }>) {
    const unitId = String(row.unidade_ubt_id)
    queueByUnit.set(unitId, (queueByUnit.get(unitId) ?? 0) + 1)
  }

  return queueByUnit
}
