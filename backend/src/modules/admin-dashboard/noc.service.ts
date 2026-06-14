import { supabaseAdmin } from '../../db/supabase.js'
import { AdminDashboardError } from './errors.js'
import { mapNocIncidentRow, parseNocHistory } from './formatters.js'
import type {
  AdminNocHistoryEntry,
  AdminNocIncidentDto,
  AdminNocPriority,
  AdminNocStatus,
} from './types.js'
import type { DashboardContratoRow, DashboardEntidadeRow, DashboardUnitRow } from './catalog.service.js'
import { daysUntilDate } from './formatters.js'

type AutoIncidentSeed = {
  fonteChave: string
  titulo: string
  entidadeId: string | null
  municipioNome: string
  categoria: AdminNocIncidentDto['category']
  prioridade: AdminNocPriority
  descricao: string
  impacto: string
  acaoRecomendada: string
  slaHoras: number
}

type NocIncidentRow = {
  id: string
  titulo: string
  entidade_contratante_id: string | null
  municipio_nome: string
  categoria: AdminNocIncidentDto['category']
  prioridade: AdminNocPriority
  status: AdminNocStatus
  responsavel: string | null
  time_nome: string
  sla_interno_horas: number
  sla_interno_estourado: boolean
  detectado_em: string
  descricao: string
  impacto: string
  acao_recomendada: string
  historico: unknown
  fonte: 'automatico' | 'manual'
  fonte_chave: string | null
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

function appendHistory(
  current: AdminNocHistoryEntry[],
  actor: string,
  note: string,
): AdminNocHistoryEntry[] {
  const at = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  return [{ at, actor, note }, ...current].slice(0, 30)
}

function buildAutoIncidents(params: {
  entidades: DashboardEntidadeRow[]
  contratosByEntidade: Map<string, DashboardContratoRow[]>
  unitsByEntidade: Map<string, DashboardUnitRow[]>
  queueByUnit: Map<string, number>
}): AutoIncidentSeed[] {
  const seeds: AutoIncidentSeed[] = []

  for (const entidade of params.entidades) {
    const contratos = params.contratosByEntidade.get(entidade.id) ?? []
    const active = contratos.find((item) => item.status === 'ativo') ?? null
    const daysToEnd = daysUntilDate(active?.dataEncerramento ?? null)

    if (daysToEnd != null && daysToEnd >= 0 && daysToEnd <= 90) {
      seeds.push({
        fonteChave: `contract-expiring:${entidade.id}`,
        titulo: 'Contrato próximo do vencimento',
        entidadeId: entidade.id,
        municipioNome: entidade.name,
        categoria: 'contract_expiring',
        prioridade: daysToEnd <= 30 ? 'critical' : 'high',
        descricao: `Contrato da prefeitura vence em ${daysToEnd} dia(s).`,
        impacto: 'Risco de interrupção do serviço após o vencimento contratual.',
        acaoRecomendada: 'Acionar comercial e validar renovação com o gestor municipal.',
        slaHoras: 48,
      })
    }

    const usagePercent = active?.percentualUtilizado ?? 0
    if (usagePercent > 95) {
      seeds.push({
        fonteChave: `package-overflow:${entidade.id}`,
        titulo: 'Estouro de pacote contratual',
        entidadeId: entidade.id,
        municipioNome: entidade.name,
        categoria: 'package_overflow',
        prioridade: 'critical',
        descricao: `Utilização do pacote em ${Math.round(usagePercent)}% no ciclo atual.`,
        impacto: 'Consultas podem ser bloqueadas ou faturadas como excedente.',
        acaoRecomendada: 'Revisar consumo com a prefeitura e avaliar aditivo contratual.',
        slaHoras: 12,
      })
    }

    const units = params.unitsByEntidade.get(entidade.id) ?? []
    for (const unit of units) {
      if (unit.stationsOnline <= 0) {
        seeds.push({
          fonteChave: `ubt-offline:${unit.id}`,
          titulo: 'UBT sem terminais online',
          entidadeId: entidade.id,
          municipioNome: entidade.name,
          categoria: 'ubt_offline',
          prioridade: 'critical',
          descricao: 'Unidade sem capacidade operacional para atendimento.',
          impacto: 'Pacientes não conseguem iniciar consultas na unidade afetada.',
          acaoRecomendada: 'Acionar suporte de infraestrutura e validar conectividade local.',
          slaHoras: 4,
        })
      }

      const queue = params.queueByUnit.get(unit.id) ?? 0
      if (queue >= 5) {
        seeds.push({
          fonteChave: `high-queue:${unit.id}`,
          titulo: 'Fila de espera elevada',
          entidadeId: entidade.id,
          municipioNome: entidade.name,
          categoria: 'high_queue',
          prioridade: queue >= 8 ? 'critical' : 'high',
          descricao: `${queue} paciente(s) aguardando atendimento na unidade.`,
          impacto: 'Tempo de espera acima do SLA operacional municipal.',
          acaoRecomendada: 'Reforçar escala médica ou redistribuir demanda entre UBTs.',
          slaHoras: 6,
        })
      }
    }
  }

  return seeds
}

export async function syncAutoNocIncidents(params: {
  entidades: DashboardEntidadeRow[]
  contratosByEntidade: Map<string, DashboardContratoRow[]>
  unitsByEntidade: Map<string, DashboardUnitRow[]>
  queueByUnit: Map<string, number>
}): Promise<void> {
  const seeds = buildAutoIncidents(params)
  const activeKeys = new Set(seeds.map((seed) => seed.fonteChave))
  const seedByKey = new Map(seeds.map((seed) => [seed.fonteChave, seed]))

  if (seeds.length > 0) {
    const keys = seeds.map((seed) => seed.fonteChave)
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from('admin_noc_incidentes')
      .select('id, fonte_chave, status')
      .in('fonte_chave', keys)

    if (existingError) throwUnlessMissingRelation(existingError)

    const existingKeys = new Set(
      ((existingRows ?? []) as Array<{ fonte_chave: string | null }>)
        .map((row) => row.fonte_chave)
        .filter((value): value is string => Boolean(value)),
    )

    const toInsert = seeds
      .filter((seed) => !existingKeys.has(seed.fonteChave))
      .map((seed) => ({
        titulo: seed.titulo,
        entidade_contratante_id: seed.entidadeId,
        municipio_nome: seed.municipioNome,
        categoria: seed.categoria,
        prioridade: seed.prioridade,
        status: 'open' as const,
        time_nome: 'NOC Plataforma',
        sla_interno_horas: seed.slaHoras,
        sla_interno_estourado: false,
        detectado_em: new Date().toISOString(),
        descricao: seed.descricao,
        impacto: seed.impacto,
        acao_recomendada: seed.acaoRecomendada,
        historico: [
          {
            at: new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(new Date()),
            actor: 'Monitor automático',
            note: 'Incidente detectado pela plataforma.',
          },
        ],
        fonte: 'automatico' as const,
        fonte_chave: seed.fonteChave,
      }))

    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin.from('admin_noc_incidentes').insert(toInsert)
      if (error) throwUnlessMissingRelation(error)
    }

    const refreshable = ((existingRows ?? []) as Array<{
      id: string
      fonte_chave: string | null
      status: AdminNocStatus
    }>).filter((row) => row.fonte_chave && row.status !== 'resolved')

    await Promise.all(
      refreshable.map(async (row) => {
        const seed = row.fonte_chave ? seedByKey.get(row.fonte_chave) : null
        if (!seed) return

        const { error } = await supabaseAdmin
          .from('admin_noc_incidentes')
          .update({
            titulo: seed.titulo,
            prioridade: seed.prioridade,
            descricao: seed.descricao,
            impacto: seed.impacto,
            acao_recomendada: seed.acaoRecomendada,
            sla_interno_horas: seed.slaHoras,
          })
          .eq('id', row.id)

        if (error) throwUnlessMissingRelation(error)
      }),
    )
  }

  const { data: openAuto, error: openError } = await supabaseAdmin
    .from('admin_noc_incidentes')
    .select('id, fonte_chave, historico')
    .eq('fonte', 'automatico')
    .neq('status', 'resolved')

  if (openError) {
    throwUnlessMissingRelation(openError)
    return
  }

  const toResolve = ((openAuto ?? []) as Array<{
    id: string
    fonte_chave: string | null
    historico: unknown
  }>).filter((row) => row.fonte_chave && !activeKeys.has(row.fonte_chave))

  await Promise.all(
    toResolve.map(async (row) => {
      const history = appendHistory(parseNocHistory(row.historico), 'Monitor automático', 'Condição normalizada — incidente encerrado.')
      const { error } = await supabaseAdmin
        .from('admin_noc_incidentes')
        .update({
          status: 'resolved',
          resolvido_em: new Date().toISOString(),
          historico: history,
        })
        .eq('id', row.id)

      if (error) throwUnlessMissingRelation(error)
    }),
  )
}

export async function loadNocIncidents(): Promise<AdminNocIncidentDto[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_noc_incidentes')
    .select(
      'id, titulo, entidade_contratante_id, municipio_nome, categoria, prioridade, status, responsavel, time_nome, sla_interno_horas, sla_interno_estourado, detectado_em, descricao, impacto, acao_recomendada, historico',
    )
    .order('detectado_em', { ascending: false })
    .limit(200)

  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return ((data ?? []) as NocIncidentRow[]).map(mapNocIncidentRow)
}

export async function updateNocIncident(params: {
  incidentId: string
  actorName: string
  team?: string
  assignee?: string | null
  status?: AdminNocStatus
}): Promise<AdminNocIncidentDto> {
  const { data: current, error: loadError } = await supabaseAdmin
    .from('admin_noc_incidentes')
    .select(
      'id, titulo, entidade_contratante_id, municipio_nome, categoria, prioridade, status, responsavel, time_nome, sla_interno_horas, sla_interno_estourado, detectado_em, descricao, impacto, acao_recomendada, historico',
    )
    .eq('id', params.incidentId)
    .maybeSingle()

  if (loadError) throwUnlessMissingRelation(loadError)
  if (!current) {
    throw new AdminDashboardError('Incidente não encontrado.', 'NOT_FOUND', 404)
  }

  const row = current as NocIncidentRow
  const history = parseNocHistory(row.historico)
  const notes: string[] = []

  const patch: Record<string, unknown> = {}

  if (params.team && params.team !== row.time_nome) {
    patch.time_nome = params.team
    notes.push(`Time alterado para ${params.team}.`)
  }

  if (params.assignee !== undefined && params.assignee !== row.responsavel) {
    patch.responsavel = params.assignee
    notes.push(
      params.assignee
        ? `Responsável definido como ${params.assignee}.`
        : 'Responsável removido.',
    )
  }

  if (params.status && params.status !== row.status) {
    patch.status = params.status
    if (params.status === 'resolved') {
      patch.resolvido_em = new Date().toISOString()
      notes.push('Incidente marcado como resolvido.')
    } else if (params.status === 'in_progress') {
      notes.push('Incidente em tratamento.')
    } else {
      notes.push('Incidente reaberto.')
      patch.resolvido_em = null
    }
  }

  if (notes.length === 0) {
    return mapNocIncidentRow(row)
  }

  let nextHistory = history
  for (const note of notes) {
    nextHistory = appendHistory(nextHistory, params.actorName, note)
  }
  patch.historico = nextHistory

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('admin_noc_incidentes')
    .update(patch)
    .eq('id', params.incidentId)
    .select(
      'id, titulo, entidade_contratante_id, municipio_nome, categoria, prioridade, status, responsavel, time_nome, sla_interno_horas, sla_interno_estourado, detectado_em, descricao, impacto, acao_recomendada, historico',
    )
    .single()

  if (updateError) throw updateError
  return mapNocIncidentRow(updated as NocIncidentRow)
}

export function countOpenNocByEntidade(incidents: AdminNocIncidentDto[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const incident of incidents) {
    if (incident.status === 'resolved' || !incident.municipalityId) continue
    counts.set(
      incident.municipalityId,
      (counts.get(incident.municipalityId) ?? 0) + 1,
    )
  }
  return counts
}
