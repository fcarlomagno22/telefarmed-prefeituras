import { supabaseAdmin } from '../../db/supabase.js'
import { generateCodigoAtendimento } from '../../lib/codigoAtendimento.js'
import { normalizeSimples, upsertConsultaAvaliacao } from '../../lib/consultaAvaliacao.js'
import { assertConsultaBelongsToUnit } from '../ubt-agenda/ownership.js'
import { assertPacienteBelongsToEntity } from '../ubt-pacientes/ownership.js'
import { assertFilaBelongsToUnit } from '../ubt-triagem/ownership.js'
import { UbtConsultasError } from './errors.js'
import type { IniciarConsultaBody } from './schemas.js'
import type { UbtScope } from '../ubt-pacientes/types.js'

export type IniciarConsultaResultDto = {
  codigoAtendimento: string
  consultaId: string
  pacienteId: string
  especialidadeId: string
  filaEsperaId: string | null
  agendaConsultaId: string | null
  doctorName: string
  startedAt: string
}

export type SalaEsperaEntradaDto = {
  position: number
  total: number
  status: 'chamado'
  estimatedMinutes: number
  readyForConsultation: boolean
}

async function resolveDoctorName(especialidadeId: string): Promise<string> {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const { data } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      usuarios_profissionais!inner ( nome ),
      escala_slots!inner ( especialidade_id, data, status )
    `,
    )
    .in('status', ['confirmado', 'realizado'])
    .eq('escala_slots.data', today)
    .eq('escala_slots.especialidade_id', especialidadeId)
    .eq('escala_slots.status', 'publicada')
    .limit(1)

  const first = data?.[0]
  if (!first) return 'Profissional de plantão'

  const prof = first.usuarios_profissionais as { nome?: string }
  return prof?.nome?.trim() || 'Profissional de plantão'
}

async function assertConsultaByCodigo(scope: UbtScope, codigoAtendimento: string) {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('id, codigo_atendimento, status, unidade_ubt_id, entidade_contratante_id, profissional_id')
    .eq('codigo_atendimento', codigoAtendimento)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtConsultasError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
  }

  return data
}

export async function iniciarUbtConsulta(
  scope: UbtScope,
  body: IniciarConsultaBody,
): Promise<IniciarConsultaResultDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, body.pacienteId)

  if (body.agendaConsultaId) {
    await assertConsultaBelongsToUnit(scope, body.agendaConsultaId)
  }

  let filaRow: Record<string, unknown> | null = null
  if (body.filaEsperaId) {
    filaRow = await assertFilaBelongsToUnit(scope, body.filaEsperaId)
    if (String(filaRow.paciente_id) !== body.pacienteId) {
      throw new UbtConsultasError('Fila não corresponde ao paciente informado.', 'INVALID_DATA', 400)
    }
  }

  const { data: existingCodigo } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('codigo_atendimento', body.codigoAtendimento)
    .maybeSingle()

  if (existingCodigo) {
    throw new UbtConsultasError('Código de atendimento já utilizado.', 'CONFLICT', 409)
  }

  const codigoAtendimento = body.codigoAtendimento.trim()
  if (!/^[a-zA-Z0-9_-]+$/.test(codigoAtendimento)) {
    throw new UbtConsultasError('Código de atendimento inválido.', 'INVALID_DATA', 400)
  }

  const now = new Date().toISOString()
  const doctorName = await resolveDoctorName(body.especialidadeId)

  const { data: created, error } = await supabaseAdmin
    .from('consultas')
    .insert({
      codigo_atendimento: codigoAtendimento,
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      paciente_id: body.pacienteId,
      profissional_id: body.profissionalId ?? null,
      especialidade_id: body.especialidadeId,
      agenda_consulta_id: body.agendaConsultaId ?? null,
      fila_espera_id: body.filaEsperaId ?? null,
      tipo: body.tipo ?? 'consulta',
      status: 'aguardando_medico',
      triagem_resumo: body.triagemResumo?.trim() ?? '',
      criado_em: now,
    })
    .select('id, codigo_atendimento')
    .single()

  if (error) throw error
  if (!created) {
    throw new UbtConsultasError('Falha ao iniciar consulta.', 'CREATE_FAILED', 500)
  }

  if (body.filaEsperaId) {
    await supabaseAdmin
      .from('fila_espera')
      .update({
        status: 'em_atendimento',
        atendimento_inicio_em: now,
        atualizado_em: now,
      })
      .eq('id', body.filaEsperaId)
      .eq('unidade_ubt_id', scope.unidadeUbtId)
  }

  if (body.agendaConsultaId) {
    await supabaseAdmin
      .from('agenda_consultas')
      .update({ status: 'em_atendimento' })
      .eq('id', body.agendaConsultaId)
      .eq('unidade_ubt_id', scope.unidadeUbtId)
  }

  return {
    codigoAtendimento: String(created.codigo_atendimento),
    consultaId: String(created.id),
    pacienteId: body.pacienteId,
    especialidadeId: body.especialidadeId,
    filaEsperaId: body.filaEsperaId ?? null,
    agendaConsultaId: body.agendaConsultaId ?? null,
    doctorName,
    startedAt: now,
  }
}

export async function entrarUbtSalaEspera(
  scope: UbtScope,
  codigoAtendimento: string,
): Promise<SalaEsperaEntradaDto> {
  const consulta = await assertConsultaByCodigo(scope, codigoAtendimento)
  const now = new Date().toISOString()

  await supabaseAdmin
    .from('consultas')
    .update({ sala_espera_entrada_em: now })
    .eq('id', consulta.id)

  const { count: waitingCount, error: countError } = await supabaseAdmin
    .from('fila_espera')
    .select('id', { count: 'exact', head: true })
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('status', 'aguardando')

  if (countError) throw countError

  const total = (waitingCount ?? 0) + 1
  const estimatedMinutes = Math.max(3, Math.min(45, total * 5))

  return {
    position: 1,
    total,
    status: 'chamado',
    estimatedMinutes,
    readyForConsultation: true,
  }
}

export async function sairUbtSalaEspera(scope: UbtScope, codigoAtendimento: string): Promise<void> {
  const consulta = await assertConsultaByCodigo(scope, codigoAtendimento)

  if (String(consulta.status) === 'em_andamento') {
    throw new UbtConsultasError(
      'Não é possível sair da sala de espera durante a teleconsulta.',
      'CONFLICT',
      409,
    )
  }

  if (String(consulta.status) !== 'aguardando_medico') {
    return
  }

  const { error } = await supabaseAdmin
    .from('consultas')
    .update({ sala_espera_entrada_em: null })
    .eq('id', consulta.id)
    .eq('status', 'aguardando_medico')

  if (error) throw error
}

export async function registrarUbtConsultaAvaliacao(
  scope: UbtScope,
  codigoAtendimento: string,
  nota: number,
  comentario?: string,
): Promise<void> {
  const consulta = await assertConsultaByCodigo(scope, codigoAtendimento)
  const normalized = normalizeSimples({ nota, comentario })

  await upsertConsultaAvaliacao(
    String(consulta.id),
    {
      notaProfissional: normalized.notaProfissional,
      comentarioProfissional: normalized.comentarioProfissional,
      notaTeleconsulta: normalized.notaTeleconsulta,
      comentarioTeleconsulta: normalized.comentarioTeleconsulta,
    },
    {
      allowUpdate: true,
      profissionalId: consulta.profissional_id ? String(consulta.profissional_id) : null,
      consultaStatus: String(consulta.status),
    },
  )
}

/** Gera código seguro quando o cliente não envia um pré-definido. */
export function generateUbtConsultaCodigo(): string {
  return generateCodigoAtendimento(24)
}
