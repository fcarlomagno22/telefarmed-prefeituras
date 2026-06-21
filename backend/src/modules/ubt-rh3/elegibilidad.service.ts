import { supabaseAdmin } from '../../db/supabase.js'
import { ensureConsultaRegistroSus } from '../../lib/consultas/registroSus.service.js'
import { isRh3Configured, rh3DeleteElegibilidad, sanitizeRh3Document } from '../../lib/rh3/index.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import { UbtRh3Error } from './errors.js'

const ACTIVE_CONSULTA_STATUSES = ['aguardando_medico', 'em_andamento'] as const
const OPEN_AGENDA_STATUSES = ['agendado', 'aguardando', 'em_atendimento'] as const

async function findActiveMtConsultaForPatient(
  scope: UbtScope,
  cpfDigits: string,
): Promise<{
  id: string
  agendaConsultaId: string | null
  criadoEm: string
  iniciadaEm: string | null
} | null> {
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .select('id')
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('cpf', cpfDigits)
    .maybeSingle()

  if (pacienteError) throw pacienteError
  if (!paciente) return null

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('id, agenda_consulta_id, criado_em, iniciada_em')
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('paciente_id', paciente.id)
    .eq('origem_atendimento', 'mt')
    .in('status', [...ACTIVE_CONSULTA_STATUSES])
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    agendaConsultaId: data.agenda_consulta_id ? String(data.agenda_consulta_id) : null,
    criadoEm: String(data.criado_em),
    iniciadaEm: data.iniciada_em ? String(data.iniciada_em) : null,
  }
}

async function finalizeLocalMtConsulta(consulta: {
  id: string
  agendaConsultaId: string | null
  criadoEm: string
  iniciadaEm: string | null
}): Promise<void> {
  const now = new Date().toISOString()
  const startedAt = consulta.iniciadaEm ?? consulta.criadoEm
  const startMs = new Date(startedAt).getTime()
  const endMs = new Date(now).getTime()
  const duracaoMinutos =
    !Number.isNaN(startMs) && endMs > startMs
      ? Math.max(1, Math.round((endMs - startMs) / 60_000))
      : null

  const { error } = await supabaseAdmin
    .from('consultas')
    .update({
      status: 'concluida',
      finalizada_em: now,
      iniciada_em: startedAt,
      ...(duracaoMinutos != null ? { duracao_minutos: duracaoMinutos } : {}),
    })
    .eq('id', consulta.id)
    .in('status', [...ACTIVE_CONSULTA_STATUSES])

  if (error) throw error

  if (consulta.agendaConsultaId) {
    await supabaseAdmin
      .from('agenda_consultas')
      .update({ status: 'realizado' })
      .eq('id', consulta.agendaConsultaId)
      .in('status', [...OPEN_AGENDA_STATUSES])
  }

  await ensureConsultaRegistroSus(consulta.id)
}

export async function releaseRh3ElegibilidadForUbt(cpf: string): Promise<void> {
  if (!isRh3Configured()) {
    throw new UbtRh3Error(
      'Integração RH3 não configurada.',
      'RH3_NOT_CONFIGURED',
      503,
    )
  }

  const document = sanitizeRh3Document(cpf)
  if (document.length !== 11) {
    throw new UbtRh3Error('CPF inválido para remover elegibilidade RH3.', 'INVALID_CPF', 400)
  }

  await rh3DeleteElegibilidad(document)
}

export async function encerrarRh3MtConsultaForUbt(scope: UbtScope, cpf: string): Promise<void> {
  const document = sanitizeRh3Document(cpf)
  if (document.length !== 11) {
    throw new UbtRh3Error('CPF inválido.', 'INVALID_CPF', 400)
  }

  const activeConsulta = await findActiveMtConsultaForPatient(scope, document)
  if (activeConsulta) {
    await finalizeLocalMtConsulta(activeConsulta)
  }

  if (isRh3Configured()) {
    await rh3DeleteElegibilidad(document)
  }
}
