import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalAtendimentosError } from './errors.js'
import type { ConsultaAccessRow } from './types.js'

export async function loadConsultaById(consultaId: string): Promise<ConsultaAccessRow> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      'id, codigo_atendimento, profissional_id, paciente_id, agenda_consulta_id, status, iniciada_em, finalizada_em',
    )
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  return {
    id: String(data.id),
    codigoAtendimento: String(data.codigo_atendimento),
    profissionalId: data.profissional_id ? String(data.profissional_id) : null,
    pacienteId: String(data.paciente_id),
    agendaConsultaId: data.agenda_consulta_id ? String(data.agenda_consulta_id) : null,
    status: String(data.status),
    iniciadaEm: data.iniciada_em ? String(data.iniciada_em) : null,
    finalizadaEm: data.finalizada_em ? String(data.finalizada_em) : null,
  }
}

export async function loadConsultaByCodigo(codigoAtendimento: string): Promise<ConsultaAccessRow> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      'id, codigo_atendimento, profissional_id, paciente_id, agenda_consulta_id, status, iniciada_em, finalizada_em',
    )
    .eq('codigo_atendimento', codigoAtendimento.trim())
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  return {
    id: String(data.id),
    codigoAtendimento: String(data.codigo_atendimento),
    profissionalId: data.profissional_id ? String(data.profissional_id) : null,
    pacienteId: String(data.paciente_id),
    agendaConsultaId: data.agenda_consulta_id ? String(data.agenda_consulta_id) : null,
    status: String(data.status),
    iniciadaEm: data.iniciada_em ? String(data.iniciada_em) : null,
    finalizadaEm: data.finalizada_em ? String(data.finalizada_em) : null,
  }
}

export async function assertConsultaReadableByProfissional(
  profissionalId: string,
  consulta: ConsultaAccessRow,
): Promise<void> {
  if (consulta.profissionalId && consulta.profissionalId !== profissionalId) {
    throw new ProfissionalAtendimentosError('Consulta atribuída a outro profissional.', 'FORBIDDEN', 403)
  }

  if (consulta.profissionalId === profissionalId) return

  if (consulta.status === 'aguardando_medico' && consulta.agendaConsultaId) {
    await assertAgendaConsultaAccessible(profissionalId, consulta.agendaConsultaId)
    return
  }

  if (consulta.status === 'aguardando_medico') {
    const { data, error } = await supabaseAdmin
      .from('consultas')
      .select('sala_espera_entrada_em')
      .eq('id', consulta.id)
      .maybeSingle()

    if (error) throw error
    if (data?.sala_espera_entrada_em) {
      return
    }
  }

  throw new ProfissionalAtendimentosError('Sem permissão para acessar esta consulta.', 'FORBIDDEN', 403)
}

export async function assertConsultaOwnedByProfissional(
  profissionalId: string,
  consulta: ConsultaAccessRow,
): Promise<void> {
  if (consulta.profissionalId !== profissionalId) {
    throw new ProfissionalAtendimentosError('Consulta atribuída a outro profissional.', 'FORBIDDEN', 403)
  }
}

export async function assertConsultaEmAndamento(consulta: ConsultaAccessRow): Promise<void> {
  if (consulta.status !== 'em_andamento') {
    throw new ProfissionalAtendimentosError(
      'Consulta não está em andamento.',
      'CONFLICT',
      409,
    )
  }
}

async function assertAgendaConsultaAccessible(
  profissionalId: string,
  agendaConsultaId: string,
): Promise<void> {
  const { data: agenda, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select('id, profissional_id, escala_slot_id')
    .eq('id', agendaConsultaId)
    .maybeSingle()

  if (error) throw error
  if (!agenda) {
    throw new ProfissionalAtendimentosError('Consulta da agenda não encontrada.', 'NOT_FOUND', 404)
  }

  if (agenda.profissional_id === profissionalId) return

  if (agenda.escala_slot_id) {
    const { data: plantao, error: plantaoError } = await supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id')
      .eq('slot_id', agenda.escala_slot_id)
      .eq('profissional_id', profissionalId)
      .in('status', ['confirmado', 'realizado'])
      .maybeSingle()

    if (plantaoError) throw plantaoError
    if (plantao) return
  }

  throw new ProfissionalAtendimentosError('Consulta fora do seu plantão.', 'FORBIDDEN', 403)
}
