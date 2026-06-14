import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { calcAgeFromBirthDate } from '../../lib/patientAge.js'
import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import { getActivePlantaoSession } from '../profissional-agenda/sessao.service.js'
import { loadProfissionalEscalaContext } from '../profissional-escala/context.service.js'
import type { ProfissionalFilaAtivaItemApi } from './schemas.js'

type OperacionalRow = {
  id: string
  codigo_atendimento: string
  agenda_consulta_id: string | null
  profissional_id: string | null
  especialidade_id: string
  status: string
  triagem_resumo: string
  iniciada_em: string | null
  sala_espera_entrada_em: string | null
  paciente_sala_atendimento_entrada_em: string | null
  criado_em: string
  paciente_nome: string
  paciente_cpf: string
  paciente_data_nascimento: string | null
  especialidade_nome: string
  unidade_nome: string
}

type ActivePlantaoScope = {
  plantaoId: string
  especialidadeId: string
}

const OPERACIONAL_SELECT =
  'id, codigo_atendimento, agenda_consulta_id, profissional_id, especialidade_id, status, triagem_resumo, iniciada_em, sala_espera_entrada_em, paciente_sala_atendimento_entrada_em, criado_em, paciente_nome, paciente_cpf, paciente_data_nascimento, especialidade_nome, unidade_nome'

async function resolveActivePlantaoScope(
  profissionalId: string,
): Promise<ActivePlantaoScope | null> {
  const activeSession = await getActivePlantaoSession(profissionalId)
  if (!activeSession?.plantaoId) return null

  const { data: plantao, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id, escala_slots!inner(especialidade_id)')
    .eq('id', activeSession.plantaoId)
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (error) {
    if (isMissingSupabaseResource(error, 'escala_plantoes_confirmados')) return null
    throw error
  }

  const slot = plantao?.escala_slots as { especialidade_id?: string | null } | null
  if (!plantao || !slot?.especialidade_id) return null

  return {
    plantaoId: String(plantao.id),
    especialidadeId: String(slot.especialidade_id),
  }
}

function mapOperacionalRow(row: OperacionalRow): ProfissionalFilaAtivaItemApi {
  return {
    consultaId: String(row.id),
    codigoAtendimento: String(row.codigo_atendimento),
    agendaConsultaId: row.agenda_consulta_id ? String(row.agenda_consulta_id) : null,
    patientName: String(row.paciente_nome),
    patientAge: calcAgeFromBirthDate(row.paciente_data_nascimento),
    patientCpf: row.paciente_cpf ? formatCpfDisplay(row.paciente_cpf) : '—',
    specialty: String(row.especialidade_nome),
    ubtName: String(row.unidade_nome || 'Teleatendimento'),
    triageReason: row.triagem_resumo?.trim() || '—',
    status: String(row.status),
    inWaitingRoom: Boolean(row.sala_espera_entrada_em),
    patientInConsultationRoom: Boolean(row.paciente_sala_atendimento_entrada_em),
    startedAtIso:
      row.iniciada_em ?? row.sala_espera_entrada_em ?? row.criado_em ?? new Date().toISOString(),
  }
}

async function loadOwnEmAndamento(
  profissionalId: string,
  especialidadeId?: string,
): Promise<OperacionalRow[]> {
  let query = supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_SELECT)
    .eq('profissional_id', profissionalId)
    .eq('status', 'em_andamento')
    .order('criado_em', { ascending: true })

  if (especialidadeId) {
    query = query.eq('especialidade_id', especialidadeId)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingSupabaseResource(error, 'vw_consultas_operacional')) return []
    throw error
  }

  return (data ?? []) as OperacionalRow[]
}

export async function listProfissionalFilaAtiva(
  profissionalId: string,
): Promise<ProfissionalFilaAtivaItemApi[]> {
  const [scope, escalaCtx] = await Promise.all([
    resolveActivePlantaoScope(profissionalId),
    loadProfissionalEscalaContext(profissionalId).catch(() => null),
  ])

  // Sem plantão ativo: não expõe sala de espera; mantém só atendimentos em andamento do médico.
  if (!scope) {
    const emAndamentoRows = await loadOwnEmAndamento(profissionalId)
    return emAndamentoRows.map(mapOperacionalRow)
  }

  const emAndamentoRows = await loadOwnEmAndamento(profissionalId, scope.especialidadeId)

  let waitingQuery = supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_SELECT)
    .eq('status', 'aguardando_medico')
    .eq('especialidade_id', scope.especialidadeId)
    .not('sala_espera_entrada_em', 'is', null)
    .order('criado_em', { ascending: true })

  if (escalaCtx?.entidadeContratanteId) {
    waitingQuery = waitingQuery.eq('entidade_contratante_id', escalaCtx.entidadeContratanteId)
  }

  const { data: waitingData, error: waitingError } = await waitingQuery

  if (waitingError) {
    if (isMissingSupabaseResource(waitingError, 'vw_consultas_operacional')) {
      return emAndamentoRows.map(mapOperacionalRow)
    }
    throw waitingError
  }

  const waitingRows = ((waitingData ?? []) as OperacionalRow[]).filter(
    (row) => !row.profissional_id || row.profissional_id === profissionalId,
  )

  const merged = new Map<string, OperacionalRow>()
  for (const row of [...emAndamentoRows, ...waitingRows]) {
    merged.set(String(row.id), row)
  }

  const sorted = [...merged.values()].sort(
    (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime(),
  )

  return sorted.map(mapOperacionalRow)
}
