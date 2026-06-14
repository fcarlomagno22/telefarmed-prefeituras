import { supabaseAdmin } from '../../db/supabase.js'
import { generateCodigoAtendimento } from '../../lib/codigoAtendimento.js'
import { ProfissionalAtendimentosError } from './errors.js'
import type { IniciarConsultaBody, IniciarConsultaResultApi } from './schemas.js'

export async function iniciarProfissionalConsulta(
  profissionalId: string,
  body: IniciarConsultaBody,
): Promise<IniciarConsultaResultApi> {
  await assertNoOtherEmAndamento(profissionalId)

  if (body.consultaId) {
    return resumeOrStartExistingConsulta(profissionalId, body.consultaId)
  }

  if (body.agendaConsultaId) {
    return startFromAgendaConsulta(profissionalId, body.agendaConsultaId, body.plantaoId)
  }

  throw new ProfissionalAtendimentosError('Consulta não informada.', 'INVALID_DATA', 400)
}

async function assertNoOtherEmAndamento(profissionalId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('profissional_id', profissionalId)
    .eq('status', 'em_andamento')
    .limit(1)

  if (error) throw error
  if (data && data.length > 0) {
    throw new ProfissionalAtendimentosError(
      'Finalize o atendimento em andamento antes de iniciar outro.',
      'CONFLICT',
      409,
    )
  }
}

async function resumeOrStartExistingConsulta(
  profissionalId: string,
  consultaId: string,
): Promise<IniciarConsultaResultApi> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      'id, codigo_atendimento, profissional_id, status, agenda_consulta_id, fila_espera_id',
    )
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  if (data.profissional_id && data.profissional_id !== profissionalId) {
    throw new ProfissionalAtendimentosError('Consulta atribuída a outro profissional.', 'FORBIDDEN', 403)
  }

  if (data.status === 'concluida' || data.status === 'cancelada') {
    throw new ProfissionalAtendimentosError('Consulta já encerrada.', 'CONFLICT', 409)
  }

  const now = new Date().toISOString()

  if (data.status === 'aguardando_medico') {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('consultas')
      .update({
        profissional_id: profissionalId,
        status: 'em_andamento',
        iniciada_em: now,
      })
      .eq('id', consultaId)
      .select('id, codigo_atendimento, status')
      .single()

    if (updateError) throw updateError

    if (data.agenda_consulta_id) {
      await supabaseAdmin
        .from('agenda_consultas')
        .update({ status: 'em_atendimento', profissional_id: profissionalId })
        .eq('id', data.agenda_consulta_id)
    }

    if (data.fila_espera_id) {
      await supabaseAdmin
        .from('fila_espera')
        .update({ status: 'em_atendimento', atendimento_inicio_em: now })
        .eq('id', data.fila_espera_id)
        .in('status', ['aguardando', 'chamado', 'em_atendimento'])
    } else if (data.agenda_consulta_id) {
      await supabaseAdmin
        .from('fila_espera')
        .update({ status: 'em_atendimento', atendimento_inicio_em: now })
        .eq('agenda_consulta_id', data.agenda_consulta_id)
        .in('status', ['aguardando', 'chamado'])
    }

    return {
      consultaId: String(updated.id),
      codigoAtendimento: String(updated.codigo_atendimento),
      status: String(updated.status),
    }
  }

  return {
    consultaId: String(data.id),
    codigoAtendimento: String(data.codigo_atendimento),
    status: String(data.status),
  }
}

async function startFromAgendaConsulta(
  profissionalId: string,
  agendaConsultaId: string,
  plantaoId?: string,
): Promise<IniciarConsultaResultApi> {
  const { data: agenda, error: agendaError } = await supabaseAdmin
    .from('agenda_consultas')
    .select(
      'id, entidade_contratante_id, unidade_ubt_id, paciente_id, especialidade_id, status, observacoes, profissional_id, escala_slot_id',
    )
    .eq('id', agendaConsultaId)
    .maybeSingle()

  if (agendaError) throw agendaError
  if (!agenda) {
    throw new ProfissionalAtendimentosError('Consulta da agenda não encontrada.', 'NOT_FOUND', 404)
  }

  await assertAgendaAccess(profissionalId, agenda, plantaoId)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('consultas')
    .select('id, codigo_atendimento, status, profissional_id')
    .eq('agenda_consulta_id', agendaConsultaId)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing) {
    return resumeOrStartExistingConsulta(profissionalId, String(existing.id))
  }

  const codigo = generateCodigoAtendimento()
  const now = new Date().toISOString()

  const { data: created, error: createError } = await supabaseAdmin
    .from('consultas')
    .insert({
      codigo_atendimento: codigo,
      entidade_contratante_id: agenda.entidade_contratante_id,
      unidade_ubt_id: agenda.unidade_ubt_id,
      paciente_id: agenda.paciente_id,
      profissional_id: profissionalId,
      especialidade_id: agenda.especialidade_id,
      agenda_consulta_id: agendaConsultaId,
      status: 'em_andamento',
      triagem_resumo: agenda.observacoes?.trim() || '',
      iniciada_em: now,
    })
    .select('id, codigo_atendimento, status')
    .single()

  if (createError) throw createError

  await supabaseAdmin
    .from('agenda_consultas')
    .update({ status: 'em_atendimento', profissional_id: profissionalId })
    .eq('id', agendaConsultaId)

  await supabaseAdmin
    .from('fila_espera')
    .update({ status: 'em_atendimento', atendimento_inicio_em: now })
    .eq('agenda_consulta_id', agendaConsultaId)
    .in('status', ['aguardando', 'chamado'])

  return {
    consultaId: String(created.id),
    codigoAtendimento: String(created.codigo_atendimento),
    status: String(created.status),
  }
}

async function assertAgendaAccess(
  profissionalId: string,
  agenda: {
    profissional_id: string | null
    escala_slot_id: string | null
  },
  plantaoId?: string,
): Promise<void> {
  if (agenda.profissional_id === profissionalId) return

  if (plantaoId) {
    const { data, error } = await supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id')
      .eq('id', plantaoId)
      .eq('profissional_id', profissionalId)
      .maybeSingle()

    if (error) throw error
    if (data) return
  }

  if (agenda.escala_slot_id) {
    const { data, error } = await supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id')
      .eq('slot_id', agenda.escala_slot_id)
      .eq('profissional_id', profissionalId)
      .in('status', ['confirmado', 'realizado'])
      .maybeSingle()

    if (error) throw error
    if (data) return
  }

  throw new ProfissionalAtendimentosError('Consulta fora do seu plantão.', 'FORBIDDEN', 403)
}
