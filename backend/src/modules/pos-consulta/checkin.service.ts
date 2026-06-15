import { supabaseAdmin } from '../../db/supabase.js'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from './config.js'
import { PosConsultaError } from './errors.js'
import {
  extractPatientFirstName,
  formatPosConsultaDateTimeLabel,
  getPosConsultaTotalCheckins,
  mapCheckinStatusToPublic,
  posConsultaCheckinDayNumber,
  resolveNextCheckinLabel,
  resolveRequestedMeasurements,
} from './formatters.js'
import type { PosConsultaCheckinRespostasInput } from './schemas.js'

type CheckinJoinRow = {
  id: string
  token: string
  numero_checkin: number
  agendado_para: string
  enviado_em: string | null
  expira_em: string | null
  respondido_em: string | null
  status: string
  pos_consulta_planos: {
    id: string
    inicio_em: string
    fim_em: string
    status: string
    consultas: {
      id: string
      pacientes: { nome: string } | Array<{ nome: string }>
      config_especialidades: { nome: string } | Array<{ nome: string }>
      usuarios_profissionais: { nome: string } | Array<{ nome: string }> | null
    }
  }
  pos_consulta_respostas: {
    payload: PosConsultaCheckinRespostasInput
    evolucao: string | null
  } | Array<{
    payload: PosConsultaCheckinRespostasInput
    evolucao: string | null
  }> | null
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

async function loadCheckinByToken(token: string): Promise<CheckinJoinRow> {
  const { data, error } = await supabaseAdmin
    .from('pos_consulta_checkins')
    .select(
      `
      id,
      token,
      numero_checkin,
      agendado_para,
      enviado_em,
      expira_em,
      respondido_em,
      status,
      pos_consulta_planos!inner (
        id,
        inicio_em,
        fim_em,
        status,
        consultas!inner (
          id,
          pacientes!inner ( nome ),
          config_especialidades!inner ( nome ),
          usuarios_profissionais ( nome )
        )
      ),
      pos_consulta_respostas ( payload, evolucao )
    `,
    )
    .eq('token', token.trim())
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PosConsultaError(
      'Este link não é válido ou já expirou. Procure sua unidade de saúde se precisar de ajuda.',
      'NOT_FOUND',
      404,
    )
  }

  return data as unknown as CheckinJoinRow
}

async function loadNextCheckinDate(planoId: string, currentNumber: number): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('pos_consulta_checkins')
    .select('agendado_para')
    .eq('plano_id', planoId)
    .gt('numero_checkin', currentNumber)
    .order('numero_checkin', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.agendado_para ? String(data.agendado_para) : null
}

function mapCheckinContext(row: CheckinJoinRow) {
  const plano = row.pos_consulta_planos
  const consulta = plano.consultas
  const paciente = unwrapOne(consulta.pacientes)
  const especialidade = unwrapOne(consulta.config_especialidades)
  const profissional = unwrapOne(consulta.usuarios_profissionais)
  const resposta = unwrapOne(row.pos_consulta_respostas)
  const totalCheckins = getPosConsultaTotalCheckins()
  const publicStatus = mapCheckinStatusToPublic(row.status, row.expira_em)

  if (row.status === 'pendente') {
    throw new PosConsultaError(
      'Este check-in ainda não está disponível. Aguarde o e-mail de acompanhamento.',
      'NOT_AVAILABLE',
      404,
    )
  }

  return {
    token: row.token,
    status: publicStatus,
    patientFirstName: extractPatientFirstName(String(paciente?.nome ?? 'Paciente')),
    specialtyName: String(especialidade?.nome ?? 'Teleconsulta'),
    doctorName: String(profissional?.nome ?? 'Profissional de saúde'),
    planDayNumber: posConsultaCheckinDayNumber(row.numero_checkin),
    planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
    checkinNumber: row.numero_checkin,
    totalCheckins,
    nextCheckinLabel:
      publicStatus === 'respondido'
        ? resolveNextCheckinLabel(row.agendado_para, row.numero_checkin, totalCheckins)
        : null,
    requestedMeasurements: resolveRequestedMeasurements(row.numero_checkin),
    respostas: resposta?.payload,
    respondidoEmLabel: row.respondido_em ? formatPosConsultaDateTimeLabel(row.respondido_em) : undefined,
  }
}

export async function getPublicPosConsultaCheckin(token: string) {
  const row = await loadCheckinByToken(token)
  return mapCheckinContext(row)
}

export async function submitPublicPosConsultaCheckin(
  token: string,
  respostas: PosConsultaCheckinRespostasInput,
): Promise<{ nextCheckinLabel: string | null }> {
  const row = await loadCheckinByToken(token)

  if (row.status === 'respondido') {
    throw new PosConsultaError('Este check-in já foi respondido.', 'ALREADY_ANSWERED', 409)
  }

  if (row.status === 'expirado' || mapCheckinStatusToPublic(row.status, row.expira_em) === 'expirado') {
    throw new PosConsultaError(
      'Este check-in expirou. Aguarde o próximo e-mail de acompanhamento.',
      'EXPIRED',
      410,
    )
  }

  if (row.status !== 'enviado') {
    throw new PosConsultaError(
      'Este check-in ainda não está disponível. Aguarde o e-mail de acompanhamento.',
      'NOT_AVAILABLE',
      404,
    )
  }

  const now = new Date().toISOString()
  const evolucao = respostas.evolucaoComparacao

  const { error: respostaError } = await supabaseAdmin.from('pos_consulta_respostas').insert({
    checkin_id: row.id,
    payload: respostas,
    evolucao,
  })

  if (respostaError) throw respostaError

  const { error: checkinError } = await supabaseAdmin
    .from('pos_consulta_checkins')
    .update({
      status: 'respondido',
      respondido_em: now,
    })
    .eq('id', row.id)
    .eq('status', 'enviado')

  if (checkinError) throw checkinError

  const nextDate = await loadNextCheckinDate(row.pos_consulta_planos.id, row.numero_checkin)
  const totalCheckins = getPosConsultaTotalCheckins()

  return {
    nextCheckinLabel: nextDate
      ? resolveNextCheckinLabel(row.agendado_para, row.numero_checkin, totalCheckins)
      : null,
  }
}
