import { supabaseAdmin } from '../../db/supabase.js'
import { formatLocalTimestampAsIso } from '../../lib/escalaDateTime.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { ProfissionalFinanceiroError } from './errors.js'
import {
  currentCompetenceKey,
  formatCompetenceLabel,
  formatExtratoItem,
  formatFechamentoApi,
  formatRepasseApi,
  repasseStatusToFechamentoStatus,
} from './formatters.js'
import type {
  FechamentoRow,
  ProfissionalFinanceiroContext,
  RepasseRow,
} from './types.js'
import type { ListRepassesQuery } from './schemas.js'

type ExtratoSource = {
  consultaId: string
  codigoAtendimento: string
  finalizadaEm: string
  startAt: string
  endAt: string
  pacienteNome: string
  especialidadeNome: string
  valorCentavos: number
  billingStatus: 'realizado' | 'previsto' | 'cancelado'
}

type PlantaoRow = {
  id: string
  status: string
  escala_slots: {
    id: string
    data: string
    hora_inicio: string
    hora_fim: string
    valor_centavos: number
    config_especialidades: { nome: string } | null
  }
}

function competenceFromDateKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

async function loadFechamentoMap(
  profissionalId: string,
  competencias: string[],
): Promise<Map<string, FechamentoRow>> {
  if (competencias.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .select('*')
    .eq('profissional_id', profissionalId)
    .in('competencia', competencias)

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_fechamento_competencia')) {
      return new Map()
    }
    throw error
  }

  const map = new Map<string, FechamentoRow>()
  for (const row of data ?? []) {
    map.set(String(row.competencia), row as FechamentoRow)
  }
  return map
}

async function buildExtratoFromConsultas(
  profissionalId: string,
  competencia: string,
): Promise<ExtratoSource[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'id, codigo_atendimento, finalizada_em, paciente_nome, especialidade_nome, entidade_contratante_id, especialidade_id',
    )
    .eq('profissional_id', profissionalId)
    .eq('status', 'concluida')
    .gte('finalizada_em', `${competencia}-01T00:00:00`)
    .lt('finalizada_em', nextCompetenceStartIso(competencia))

  if (error) {
    if (isMissingSupabaseResource(error, 'vw_consultas_operacional')) return []
    throw error
  }

  const rows = data ?? []
  if (rows.length === 0) return []

  const defaultValor = await resolveDefaultConsultaValorCentavos(profissionalId)

  return rows.map((row) => ({
    consultaId: String(row.id),
    codigoAtendimento: String(row.codigo_atendimento),
    finalizadaEm: String(row.finalizada_em ?? new Date().toISOString()),
    startAt: String(row.finalizada_em ?? new Date().toISOString()),
    endAt: String(row.finalizada_em ?? new Date().toISOString()),
    pacienteNome: String(row.paciente_nome ?? 'Paciente'),
    especialidadeNome: String(row.especialidade_nome ?? 'Consulta'),
    valorCentavos: defaultValor,
    billingStatus: 'realizado' as const,
  }))
}

function resolvePlantaoBillingStatus(
  plantaoStatus: string,
  hasEndedSession: boolean,
): ExtratoSource['billingStatus'] {
  if (plantaoStatus === 'cancelado' || plantaoStatus === 'falta_profissional') {
    return 'cancelado'
  }
  if (plantaoStatus === 'realizado' || hasEndedSession) {
    return 'realizado'
  }
  return 'previsto'
}

async function loadEndedPlantaoSessionIds(
  profissionalId: string,
  plantaoIds: string[],
): Promise<Set<string>> {
  if (plantaoIds.length === 0) return new Set()

  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select('plantao_id')
    .eq('profissional_id', profissionalId)
    .in('plantao_id', plantaoIds)
    .not('ended_at', 'is', null)

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_plantao_sessoes')) {
      return new Set()
    }
    throw error
  }

  return new Set((data ?? []).map((row) => String(row.plantao_id)))
}

function summarizeExtrato(extrato: ExtratoSource[]) {
  const realizados = extrato.filter((item) => item.billingStatus === 'realizado')
  const previstos = extrato.filter((item) => item.billingStatus === 'previsto')

  return {
    valorRealizadoCentavos: realizados.reduce((sum, item) => sum + item.valorCentavos, 0),
    valorPrevistoCentavos: previstos.reduce((sum, item) => sum + item.valorCentavos, 0),
    qtdRealizadas: realizados.length,
    qtdPrevistas: previstos.length,
  }
}

async function resolveDefaultConsultaValorCentavos(profissionalId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('escala_slots!inner(valor_centavos)')
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .limit(1)
    .maybeSingle()

  const slot = data?.escala_slots as { valor_centavos?: number } | undefined
  return Number(slot?.valor_centavos ?? 0) || 15_000
}

function nextCompetenceStartIso(competencia: string): string {
  const [yearStr, monthStr] = competencia.split('-')
  const year = Number.parseInt(yearStr ?? '2026', 10)
  const month = Number.parseInt(monthStr ?? '1', 10)
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }
  return `${next.y}-${String(next.m).padStart(2, '0')}-01T00:00:00`
}

async function buildExtratoFromPlantoes(
  profissionalId: string,
  competencia: string,
): Promise<ExtratoSource[]> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      'id, status, escala_slots!inner(id, data, hora_inicio, hora_fim, valor_centavos, config_especialidades!inner(nome))',
    )
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .gte('escala_slots.data', `${competencia}-01`)
    .lt('escala_slots.data', nextCompetenceDate(competencia))

  if (error) throw error

  const plantaoRows = (data ?? []) as unknown as PlantaoRow[]
  const endedSessionIds = await loadEndedPlantaoSessionIds(
    profissionalId,
    plantaoRows.map((row) => String(row.id)),
  )

  const items: ExtratoSource[] = []
  for (const row of plantaoRows) {
    const slot = row.escala_slots
    if (!slot) continue

    const startAt = formatLocalTimestampAsIso(`${slot.data} ${slot.hora_inicio}`)
    const endAt = formatLocalTimestampAsIso(`${slot.data} ${slot.hora_fim}`)
    const billingStatus = resolvePlantaoBillingStatus(
      row.status,
      endedSessionIds.has(String(row.id)),
    )

    items.push({
      consultaId: String(row.id),
      codigoAtendimento: String(slot.id).slice(0, 8).toUpperCase(),
      finalizadaEm: endAt,
      startAt,
      endAt,
      pacienteNome:
        billingStatus === 'realizado' ? 'Plantão realizado' : 'Plantão previsto',
      especialidadeNome: String(slot.config_especialidades?.nome ?? 'Plantão'),
      valorCentavos: Number(slot.valor_centavos ?? 0),
      billingStatus,
    })
  }

  return items.sort((a, b) => a.finalizadaEm.localeCompare(b.finalizadaEm))
}

function nextCompetenceDate(competencia: string): string {
  const [yearStr, monthStr] = competencia.split('-')
  const year = Number.parseInt(yearStr ?? '2026', 10)
  const month = Number.parseInt(monthStr ?? '1', 10)
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }
  return `${next.y}-${String(next.m).padStart(2, '0')}-01`
}

async function buildExtrato(
  profissionalId: string,
  competencia: string,
): Promise<ExtratoSource[]> {
  const fromConsultas = await buildExtratoFromConsultas(profissionalId, competencia)
  if (fromConsultas.length > 0) return fromConsultas
  return buildExtratoFromPlantoes(profissionalId, competencia)
}

async function upsertRepasseFromExtrato(
  profissionalId: string,
  competencia: string,
  extrato: ExtratoSource[],
  fechamento: FechamentoRow | null,
): Promise<RepasseRow> {
  const summary = summarizeExtrato(extrato)
  const valorCentavos = summary.valorRealizadoCentavos
  const qtdConsultas = summary.qtdRealizadas
  const status =
    fechamento?.status === 'pago'
      ? 'pago'
      : fechamento?.status === 'em_analise' || fechamento?.status === 'aprovado'
        ? 'processando'
        : 'pendente'

  const { data, error } = await supabaseAdmin
    .from('profissional_repasse_competencia')
    .upsert(
      {
        profissional_id: profissionalId,
        competencia,
        qtd_consultas: qtdConsultas,
        valor_centavos: valorCentavos,
        status,
        pago_em: fechamento?.paid_at ?? null,
      },
      { onConflict: 'profissional_id,competencia' },
    )
    .select('*')
    .single()

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_repasse_competencia')) {
      throw new ProfissionalFinanceiroError(
        'Módulo financeiro indisponível.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    }
    throw error
  }

  return data as RepasseRow
}

export async function syncProfissionalRepasses(
  ctx: ProfissionalFinanceiroContext,
): Promise<Map<string, ReturnType<typeof summarizeExtrato>>> {
  const summaryByCompetence = new Map<string, ReturnType<typeof summarizeExtrato>>()
  const { data: plantoes, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, escala_slots!inner(data)')
    .eq('profissional_id', ctx.profissionalId)
    .in('status', ['confirmado', 'realizado'])

  if (error) throw error

  const competencias = new Set<string>()
  competencias.add(currentCompetenceKey())

  for (const row of plantoes ?? []) {
    const slot = row.escala_slots as { data?: string }
    if (slot?.data) competencias.add(competenceFromDateKey(String(slot.data)))
  }

  const fechamentoMap = await loadFechamentoMap(ctx.profissionalId, [...competencias])

  for (const competencia of competencias) {
    const extrato = await buildExtrato(ctx.profissionalId, competencia)
    summaryByCompetence.set(competencia, summarizeExtrato(extrato))
    if (extrato.length === 0) continue
    await upsertRepasseFromExtrato(
      ctx.profissionalId,
      competencia,
      extrato,
      fechamentoMap.get(competencia) ?? null,
    )
  }

  return summaryByCompetence
}

export async function listProfissionalRepasses(
  ctx: ProfissionalFinanceiroContext,
  query: ListRepassesQuery,
) {
  const summaryByCompetence = await syncProfissionalRepasses(ctx)

  let dbQuery = supabaseAdmin
    .from('profissional_repasse_competencia')
    .select('*')
    .eq('profissional_id', ctx.profissionalId)
    .order('competencia', { ascending: false })

  if (query.competenciaFrom) dbQuery = dbQuery.gte('competencia', query.competenciaFrom)
  if (query.competenciaTo) dbQuery = dbQuery.lte('competencia', query.competenciaTo)
  if (query.status) dbQuery = dbQuery.eq('status', query.status)

  const offset = query.offset ?? 0
  const limit = query.limit ?? 120
  dbQuery = dbQuery.range(offset, offset + limit - 1)

  const { data, error } = await dbQuery
  if (error) throw error

  return (data ?? []).map((row) =>
    formatRepasseApi(row as RepasseRow, summaryByCompetence.get(String(row.competencia))),
  )
}

export async function getProfissionalRepasseDetail(
  ctx: ProfissionalFinanceiroContext,
  competencia: string,
) {
  const extratoSources = await buildExtrato(ctx.profissionalId, competencia)
  const fechamentoMap = await loadFechamentoMap(ctx.profissionalId, [competencia])
  const fechamento = fechamentoMap.get(competencia) ?? null

  let repasseRow: RepasseRow | null = null

  const { data: existing } = await supabaseAdmin
    .from('profissional_repasse_competencia')
    .select('*')
    .eq('profissional_id', ctx.profissionalId)
    .eq('competencia', competencia)
    .maybeSingle()

  if (existing) {
    repasseRow = existing as RepasseRow
  } else if (extratoSources.length > 0) {
    repasseRow = await upsertRepasseFromExtrato(
      ctx.profissionalId,
      competencia,
      extratoSources,
      fechamento,
    )
  }

  if (!repasseRow) {
    throw new ProfissionalFinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)
  }

  const extrato = extratoSources.map(formatExtratoItem)
  const repasse = formatRepasseApi(repasseRow, summarizeExtrato(extratoSources))

  return {
    ...repasse,
    extrato,
    competenciaLabel: formatCompetenceLabel(competencia),
    fechamento: formatFechamentoApi(fechamento) ?? {
      competencia,
      status: repasseStatusToFechamentoStatus(repasseRow.status, fechamento),
    },
  }
}

export async function getProfissionalFinanceiroSummary(ctx: ProfissionalFinanceiroContext) {
  const summaryByCompetence = await syncProfissionalRepasses(ctx)

  const { data, error } = await supabaseAdmin
    .from('profissional_repasse_competencia')
    .select('*')
    .eq('profissional_id', ctx.profissionalId)

  if (error) throw error

  const repasses = (data ?? []) as RepasseRow[]
  const current = currentCompetenceKey()
  const yearPrefix = `${new Date().getFullYear()}-`

  const currentRepasse = repasses.find((row) => row.competencia === current)
  const totalPendenteCentavos = repasses
    .filter((row) => row.status === 'pendente' || row.status === 'processando')
    .reduce((sum, row) => sum + Number(row.valor_centavos ?? 0), 0)

  const totalPagoAnoCentavos = repasses
    .filter((row) => row.status === 'pago' && row.competencia.startsWith(yearPrefix))
    .reduce((sum, row) => sum + Number(row.valor_centavos ?? 0), 0)

  const valorMesAtualCentavos = Number(currentRepasse?.valor_centavos ?? 0)
  const currentSummary = summaryByCompetence.get(current)
  const consultasMesPrevistas = currentSummary?.qtdPrevistas ?? 0

  return {
    competenciaAtual: current,
    totalPendenteCentavos,
    totalPagoAnoCentavos,
    consultasMesAtual: Number(currentRepasse?.qtd_consultas ?? 0),
    consultasMesPrevistas,
    valorMesAtualCentavos,
    valorMesPrevistoCentavos: currentSummary?.valorPrevistoCentavos ?? 0,
    totalPendente: totalPendenteCentavos / 100,
    totalPagoAno: totalPagoAnoCentavos / 100,
    valorMesAtual: valorMesAtualCentavos / 100,
    valorMesPrevisto: (currentSummary?.valorPrevistoCentavos ?? 0) / 100,
  }
}
