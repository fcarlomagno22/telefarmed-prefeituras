import { supabaseAdmin } from '../db/supabase.js'
import { ensureConsultaRegistroSus } from './consultas/registroSus.service.js'

export type ConsultaAvaliacaoDetalhadaInput = {
  notaProfissional: number
  comentarioProfissional?: string
  notaTeleconsulta: number
  comentarioTeleconsulta?: string
}

export type ConsultaAvaliacaoSimplesInput = {
  nota: number
  comentario?: string
}

export function computeNotaMedia(notaProfissional: number, notaTeleconsulta: number): number {
  return Math.round((notaProfissional + notaTeleconsulta) / 2)
}

export function mergeComentarioLegacy(
  comentarioProfissional: string,
  comentarioTeleconsulta: string,
): string {
  return [comentarioProfissional, comentarioTeleconsulta]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n\n')
}

function normalizeDetalhada(input: ConsultaAvaliacaoDetalhadaInput) {
  const notaProfissional = input.notaProfissional
  const notaTeleconsulta = input.notaTeleconsulta
  const comentarioProfissional = input.comentarioProfissional?.trim() ?? ''
  const comentarioTeleconsulta = input.comentarioTeleconsulta?.trim() ?? ''

  return {
    notaProfissional,
    notaTeleconsulta,
    comentarioProfissional,
    comentarioTeleconsulta,
    nota: computeNotaMedia(notaProfissional, notaTeleconsulta),
    comentario: mergeComentarioLegacy(comentarioProfissional, comentarioTeleconsulta),
  }
}

export function normalizeSimples(input: ConsultaAvaliacaoSimplesInput): ReturnType<typeof normalizeDetalhada> {
  const comentario = input.comentario?.trim() ?? ''
  return normalizeDetalhada({
    notaProfissional: input.nota,
    notaTeleconsulta: input.nota,
    comentarioProfissional: comentario,
    comentarioTeleconsulta: '',
  })
}

export async function recalculateProfissionalRating(profissionalId: string): Promise<void> {
  const { data: consultas, error: consultasError } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('profissional_id', profissionalId)

  if (consultasError) throw consultasError

  const consultaIds = (consultas ?? []).map((row) => String(row.id))
  if (consultaIds.length === 0) {
    const { error: resetError } = await supabaseAdmin
      .from('usuarios_profissionais')
      .update({ rating_media: 0, rating_total: 0 })
      .eq('id', profissionalId)

    if (resetError) throw resetError
    return
  }

  const { data, error } = await supabaseAdmin
    .from('consulta_avaliacoes')
    .select('nota_profissional, nota')
    .in('consulta_id', consultaIds)

  if (error) throw error

  const notas = (data ?? [])
    .map((row) => {
      const prof = row.nota_profissional ?? row.nota
      return typeof prof === 'number' ? prof : null
    })
    .filter((value): value is number => value != null && value >= 1 && value <= 5)

  const ratingTotal = notas.length
  const ratingMedia =
    ratingTotal > 0
      ? Math.round((notas.reduce((sum, value) => sum + value, 0) / ratingTotal) * 100) / 100
      : 0

  const { error: updateError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({
      rating_media: ratingMedia,
      rating_total: ratingTotal,
    })
    .eq('id', profissionalId)

  if (updateError) throw updateError
}

export async function finalizeConsultaAfterAvaliacao(
  consultaId: string,
  currentStatus: string,
): Promise<void> {
  if (currentStatus === 'concluida' || currentStatus === 'cancelada') return

  const { data: consulta, error: loadError } = await supabaseAdmin
    .from('consultas')
    .select('id, profissional_id, agenda_consulta_id, fila_espera_id, iniciada_em, criado_em')
    .eq('id', consultaId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!consulta) return

  let profissionalId = consulta.profissional_id ? String(consulta.profissional_id) : null
  let iniciadaEm = consulta.iniciada_em ? String(consulta.iniciada_em) : null
  let agendaConsultaId = consulta.agenda_consulta_id
    ? String(consulta.agenda_consulta_id)
    : null

  if (consulta.fila_espera_id) {
    const { data: fila, error: filaError } = await supabaseAdmin
      .from('fila_espera')
      .select('atendimento_inicio_em, agenda_consulta_id')
      .eq('id', consulta.fila_espera_id)
      .maybeSingle()

    if (filaError) throw filaError
    if (fila?.atendimento_inicio_em && !iniciadaEm) {
      iniciadaEm = String(fila.atendimento_inicio_em)
    }
    if (fila?.agenda_consulta_id && !agendaConsultaId) {
      agendaConsultaId = String(fila.agenda_consulta_id)
    }
  }

  if (agendaConsultaId) {
    const { data: agenda, error: agendaError } = await supabaseAdmin
      .from('agenda_consultas')
      .select('profissional_id')
      .eq('id', agendaConsultaId)
      .maybeSingle()

    if (agendaError) throw agendaError
    if (!profissionalId && agenda?.profissional_id) {
      profissionalId = String(agenda.profissional_id)
    }
  }

  const now = new Date().toISOString()
  const startedAt = iniciadaEm ?? consulta.criado_em ?? now
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
      ...(profissionalId ? { profissional_id: profissionalId } : {}),
      ...(iniciadaEm ? { iniciada_em: iniciadaEm } : {}),
      ...(agendaConsultaId ? { agenda_consulta_id: agendaConsultaId } : {}),
      ...(duracaoMinutos != null ? { duracao_minutos: duracaoMinutos } : {}),
    })
    .eq('id', consultaId)

  if (error) throw error

  if (agendaConsultaId) {
    await supabaseAdmin
      .from('agenda_consultas')
      .update({ status: 'realizado' })
      .eq('id', agendaConsultaId)
      .eq('status', 'em_atendimento')

    await supabaseAdmin
      .from('fila_espera')
      .update({ status: 'finalizado', encerrado_em: now })
      .eq('agenda_consulta_id', agendaConsultaId)
      .in('status', ['em_atendimento', 'chamado', 'aguardando'])
  } else if (consulta.fila_espera_id) {
    await supabaseAdmin
      .from('fila_espera')
      .update({ status: 'finalizado', encerrado_em: now })
      .eq('id', consulta.fila_espera_id)
      .in('status', ['em_atendimento', 'chamado', 'aguardando'])
  }

  await ensureConsultaRegistroSus(consultaId)
}

type UpsertConsultaAvaliacaoOptions = {
  allowUpdate?: boolean
  profissionalId?: string | null
  consultaStatus?: string
}

export async function upsertConsultaAvaliacao(
  consultaId: string,
  input: ConsultaAvaliacaoDetalhadaInput,
  options: UpsertConsultaAvaliacaoOptions = {},
): Promise<{ created: boolean }> {
  const normalized = normalizeDetalhada(input)
  const now = new Date().toISOString()

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('consulta_avaliacoes')
    .select('id')
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing && !options.allowUpdate) {
    return { created: false }
  }

  const payload = {
    nota: normalized.nota,
    comentario: normalized.comentario,
    nota_profissional: normalized.notaProfissional,
    nota_teleconsulta: normalized.notaTeleconsulta,
    comentario_profissional: normalized.comentarioProfissional,
    comentario_teleconsulta: normalized.comentarioTeleconsulta,
    avaliado_em: now,
  }

  if (existing) {
    const { error } = await supabaseAdmin
      .from('consulta_avaliacoes')
      .update(payload)
      .eq('consulta_id', consultaId)

    if (error) throw error
  } else {
    const { error } = await supabaseAdmin.from('consulta_avaliacoes').insert({
      consulta_id: consultaId,
      ...payload,
    })

    if (error) throw error
  }

  if (options.consultaStatus) {
    await finalizeConsultaAfterAvaliacao(consultaId, options.consultaStatus)
  }

  if (options.profissionalId) {
    await recalculateProfissionalRating(options.profissionalId)
  }

  return { created: !existing }
}
