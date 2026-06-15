import { supabaseAdmin } from '../../db/supabase.js'
import {
  POS_CONSULTA_CHECKIN_INTERVAL_DAYS,
  POS_CONSULTA_PLAN_TOTAL_DAYS,
  getPosConsultaTotalCheckins,
} from './config.js'
import { generatePosConsultaCheckinToken } from './token.js'

type ConsultaPlanoRow = {
  id: string
  status: string
  paciente_id: string
  especialidade_id: string
  entidade_contratante_id: string
  profissional_id: string | null
  finalizada_em: string | null
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function scheduleCheckinDates(inicio: Date): string[] {
  const total = getPosConsultaTotalCheckins()
  const dates: string[] = []
  for (let index = 1; index <= total; index += 1) {
    dates.push(toDateOnly(addDays(inicio, index * POS_CONSULTA_CHECKIN_INTERVAL_DAYS)))
  }
  return dates
}

async function loadConsultaForPlano(consultaId: string): Promise<ConsultaPlanoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      'id, status, paciente_id, especialidade_id, entidade_contratante_id, profissional_id, finalizada_em',
    )
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return data as ConsultaPlanoRow
}

/**
 * Cria plano + check-ins agendados de forma idempotente (1 plano por consulta concluída).
 */
export async function ensurePosConsultaPlanoForConsulta(consultaId: string): Promise<void> {
  const consulta = await loadConsultaForPlano(consultaId)
  if (!consulta || consulta.status !== 'concluida') return

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('pos_consulta_planos')
    .select('id')
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return

  const inicio = consulta.finalizada_em ? new Date(consulta.finalizada_em) : new Date()
  const fim = addDays(inicio, POS_CONSULTA_PLAN_TOTAL_DAYS)

  const { data: plano, error: planoError } = await supabaseAdmin
    .from('pos_consulta_planos')
    .insert({
      consulta_id: consultaId,
      paciente_id: consulta.paciente_id,
      especialidade_id: consulta.especialidade_id,
      entidade_contratante_id: consulta.entidade_contratante_id,
      profissional_id: consulta.profissional_id,
      inicio_em: inicio.toISOString(),
      fim_em: fim.toISOString(),
      status: 'ativo',
    })
    .select('id')
    .single()

  if (planoError) throw planoError

  const scheduleDates = scheduleCheckinDates(inicio)
  const checkinRows = scheduleDates.map((agendadoPara, index) => ({
    plano_id: plano.id,
    token: generatePosConsultaCheckinToken(),
    numero_checkin: index + 1,
    agendado_para: agendadoPara,
    status: 'pendente',
  }))

  const { error: checkinsError } = await supabaseAdmin.from('pos_consulta_checkins').insert(checkinRows)
  if (checkinsError) throw checkinsError
}
