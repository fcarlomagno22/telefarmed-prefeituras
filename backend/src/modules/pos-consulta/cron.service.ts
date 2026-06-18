import { supabaseAdmin } from '../../db/supabase.js'
import {
  POS_CONSULTA_MAX_TOKEN_REENVIOS,
  POS_CONSULTA_TOKEN_TTL_HOURS,
} from './config.js'
import { sendPosConsultaCheckinEmail } from './email.service.js'
import { extractPatientFirstName, posConsultaCheckinDayNumber } from './formatters.js'

const APP_TIMEZONE = 'America/Sao_Paulo'

function todayDateOnly(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

type DueCheckinRow = {
  id: string
  token: string
  numero_checkin: number
  agendado_para: string
  reenvios: number
  pos_consulta_planos: {
    id: string
    status: string
    consultas: {
      unidade_ubt_id?: string
      pacientes: { nome: string; email: string | null } | Array<{ nome: string; email: string | null }>
      config_especialidades: { nome: string } | Array<{ nome: string }>
      usuarios_profissionais: { nome: string } | Array<{ nome: string }> | null
    }
  }
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

async function loadDueCheckins(): Promise<DueCheckinRow[]> {
  const today = todayDateOnly()
  const { data, error } = await supabaseAdmin
    .from('pos_consulta_checkins')
    .select(
      `
      id,
      token,
      numero_checkin,
      agendado_para,
      reenvios,
      pos_consulta_planos!inner (
        id,
        status,
        consultas!inner (
          unidade_ubt_id,
          pacientes!inner ( nome, email ),
          config_especialidades!inner ( nome ),
          usuarios_profissionais ( nome )
        )
      )
    `,
    )
    .eq('status', 'pendente')
    .lte('agendado_para', today)

  if (error) throw error
  return (data ?? []) as unknown as DueCheckinRow[]
}

async function loadExpiredCheckins(): Promise<Array<{ id: string; reenvios: number; token: string; numero_checkin: number; pos_consulta_planos: DueCheckinRow['pos_consulta_planos'] }>> {
  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('pos_consulta_checkins')
    .select(
      `
      id,
      token,
      numero_checkin,
      reenvios,
      pos_consulta_planos!inner (
        id,
        status,
        consultas!inner (
          unidade_ubt_id,
          pacientes!inner ( nome, email ),
          config_especialidades!inner ( nome ),
          usuarios_profissionais ( nome )
        )
      )
    `,
    )
    .eq('status', 'enviado')
    .lt('expira_em', now)

  if (error) throw error
  return (data ?? []) as unknown as Array<{
    id: string
    reenvios: number
    token: string
    numero_checkin: number
    pos_consulta_planos: DueCheckinRow['pos_consulta_planos']
  }>
}

async function sendCheckinEmailFromRow(row: DueCheckinRow): Promise<boolean> {
  const consulta = row.pos_consulta_planos.consultas
  const paciente = unwrapOne(consulta.pacientes)
  const especialidade = unwrapOne(consulta.config_especialidades)
  const profissional = unwrapOne(consulta.usuarios_profissionais)
  const email = paciente?.email?.trim()

  if (!email) {
    console.warn('[pos-consulta-cron] Paciente sem e-mail — check-in não enviado.', row.id)
    return false
  }

  await sendPosConsultaCheckinEmail({
    to: email,
    patientFirstName: extractPatientFirstName(String(paciente?.nome ?? 'Paciente')),
    doctorName: String(profissional?.nome ?? 'Profissional de saúde'),
    specialtyName: String(especialidade?.nome ?? 'Teleconsulta'),
    checkinToken: row.token,
    checkinNumber: row.numero_checkin,
    planDayNumber: posConsultaCheckinDayNumber(row.numero_checkin),
    unidadeUbtId: consulta.unidade_ubt_id ? String(consulta.unidade_ubt_id) : undefined,
  })

  return true
}

async function markCheckinSent(checkinId: string): Promise<void> {
  const now = new Date()
  const { error } = await supabaseAdmin
    .from('pos_consulta_checkins')
    .update({
      status: 'enviado',
      enviado_em: now.toISOString(),
      expira_em: addHours(now, POS_CONSULTA_TOKEN_TTL_HOURS).toISOString(),
    })
    .eq('id', checkinId)
    .eq('status', 'pendente')

  if (error) throw error
}

async function closeExpiredPlans(): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('pos_consulta_planos')
    .update({ status: 'encerrado' })
    .eq('status', 'ativo')
    .lt('fim_em', now)

  if (error) throw error
}

export async function runPosConsultaCronJobs(): Promise<void> {
  await closeExpiredPlans()

  const dueCheckins = await loadDueCheckins()
  for (const row of dueCheckins) {
    if (row.pos_consulta_planos.status !== 'ativo') continue
    try {
      const sent = await sendCheckinEmailFromRow(row)
      if (sent) {
        await markCheckinSent(row.id)
      }
    } catch (error) {
      console.error('[pos-consulta-cron] Falha ao enviar check-in agendado.', row.id, error)
    }
  }

  const expiredCheckins = await loadExpiredCheckins()
  for (const row of expiredCheckins) {
    try {
      if (row.reenvios < POS_CONSULTA_MAX_TOKEN_REENVIOS) {
        const sent = await sendCheckinEmailFromRow(row as DueCheckinRow)
        if (sent) {
          const now = new Date()
          const { error } = await supabaseAdmin
            .from('pos_consulta_checkins')
            .update({
              status: 'enviado',
              enviado_em: now.toISOString(),
              expira_em: addHours(now, POS_CONSULTA_TOKEN_TTL_HOURS).toISOString(),
              reenvios: row.reenvios + 1,
            })
            .eq('id', row.id)
            .eq('status', 'enviado')
          if (error) throw error
        }
        continue
      }

      const { error } = await supabaseAdmin
        .from('pos_consulta_checkins')
        .update({ status: 'expirado' })
        .eq('id', row.id)
        .eq('status', 'enviado')

      if (error) throw error
    } catch (error) {
      console.error('[pos-consulta-cron] Falha ao expirar/reenviar check-in.', row.id, error)
    }
  }
}

export function enqueuePosConsultaCronJobs(): void {
  void runPosConsultaCronJobs().catch((error) => {
    console.error('[pos-consulta-cron] Falha no job de acompanhamento pós-consulta.', error)
  })
}
