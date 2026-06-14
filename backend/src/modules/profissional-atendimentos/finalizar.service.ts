import { supabaseAdmin } from '../../db/supabase.js'
import { logAtendimentoConsultaEventoSafe } from '../../lib/auditoria/atendimento-events.js'
import { ProfissionalAtendimentosError } from './errors.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  loadConsultaById,
} from './ownership.js'

export async function finalizarProfissionalAtendimento(
  profissionalId: string,
  consultaId: string,
  body: { notasClinicas?: string; interrompido?: boolean },
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  const now = new Date().toISOString()
  const status = body.interrompido ? 'interrompida' : 'concluida'
  const startedAt = consulta.iniciadaEm ? new Date(consulta.iniciadaEm) : new Date(now)
  const endMs = new Date(now).getTime()
  const startMs = startedAt.getTime()
  const duracaoMinutos =
    !Number.isNaN(startMs) && endMs > startMs
      ? Math.max(1, Math.round((endMs - startMs) / 60_000))
      : null

  const updatePayload: Record<string, unknown> = {
    status,
    finalizada_em: now,
    duracao_minutos: duracaoMinutos,
    profissional_id: profissionalId,
  }

  if (body.notasClinicas !== undefined) {
    updatePayload.notas_clinicas = body.notasClinicas.trim()
  }

  const { error } = await supabaseAdmin
    .from('consultas')
    .update(updatePayload)
    .eq('id', consultaId)
    .eq('status', 'em_andamento')

  if (error) throw error

  if (consulta.agendaConsultaId) {
    const agendaStatus = body.interrompido ? 'cancelado' : 'realizado'
    await supabaseAdmin
      .from('agenda_consultas')
      .update({ status: agendaStatus })
      .eq('id', consulta.agendaConsultaId)

    const filaStatus = body.interrompido ? 'desistiu' : 'finalizado'
    await supabaseAdmin
      .from('fila_espera')
      .update({
        status: filaStatus,
        encerrado_em: now,
      })
      .eq('agenda_consulta_id', consulta.agendaConsultaId)
      .in('status', ['em_atendimento', 'chamado', 'aguardando'])
  }

  await supabaseAdmin
    .from('usuarios_profissionais')
    .update({ status_plantao: 'disponivel' })
    .eq('id', profissionalId)
    .eq('status_plantao', 'em_atendimento')

  logAtendimentoConsultaEventoSafe({
    acao: body.interrompido ? 'acao_sensivel' : 'editar',
    descricao: body.interrompido
      ? 'Consulta interrompida pelo profissional'
      : 'Consulta finalizada pelo profissional',
    consultaId,
    profissionalId,
    codigoAtendimento: consulta.codigoAtendimento,
    payload: {
      status,
      duracaoMinutos,
      interrompido: Boolean(body.interrompido),
    },
  })
}

export async function assertConsultaFinalizavel(
  profissionalId: string,
  consultaId: string,
): Promise<void> {
  const consulta = await loadConsultaById(consultaId)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)

  if (consulta.status !== 'em_andamento') {
    throw new ProfissionalAtendimentosError('Consulta não está em andamento.', 'CONFLICT', 409)
  }
}
