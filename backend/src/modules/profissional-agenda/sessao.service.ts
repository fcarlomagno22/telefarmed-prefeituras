import { supabaseAdmin } from '../../db/supabase.js'
import { isPlantaoEncerradoParaProfissional } from '../../lib/escalaSlotLifecycle.js'
import { isSlotStartReached } from '../../lib/escalaDateTime.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { ProfissionalAgendaError } from './errors.js'
import type {
  ProfissionalAgendaActiveSessionApi,
  ProfissionalAgendaEndShiftSummaryInput,
} from './types.js'
import { assertPlantaoBelongsToProfissional } from './ownership.js'

type SessaoRow = {
  id: string
  plantao_id: string
  entered_at: string
  ended_at: string | null
  summary: ProfissionalAgendaEndShiftSummaryInput | null
}

export async function getActivePlantaoSession(
  profissionalId: string,
): Promise<ProfissionalAgendaActiveSessionApi | null> {
  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select('id, plantao_id, entered_at, ended_at, summary')
    .eq('profissional_id', profissionalId)
    .is('ended_at', null)
    .maybeSingle()

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_plantao_sessoes')) {
      return null
    }
    throw error
  }

  if (!data) return null
  return mapSessaoRow(data as SessaoRow)
}

export async function enterProfissionalPlantao(
  profissionalId: string,
  plantaoId: string,
): Promise<ProfissionalAgendaActiveSessionApi> {
  const plantao = await assertPlantaoBelongsToProfissional(profissionalId, plantaoId)

  if (plantao.status === 'realizado') {
    throw new ProfissionalAgendaError('Este plantão já foi encerrado.', 'CONFLICT', 409)
  }

  const { data: slot, error: slotError } = await supabaseAdmin
    .from('escala_slots')
    .select('data, hora_inicio, hora_fim, status')
    .eq('id', plantao.slot_id)
    .maybeSingle()

  if (slotError) throw slotError
  if (slot && !isSlotStartReached(String(slot.data), String(slot.hora_inicio))) {
    throw new ProfissionalAgendaError(
      'O plantão ainda não começou. Aguarde o horário de início previsto.',
      'INVALID_DATA',
      400,
    )
  }
  if (
    slot &&
    isPlantaoEncerradoParaProfissional({
      plantaoStatus: plantao.status,
      slotData: String(slot.data),
      slotHoraFim: String(slot.hora_fim),
      slotStatus: String(slot.status),
    })
  ) {
    throw new ProfissionalAgendaError('Este plantão já foi encerrado.', 'CONFLICT', 409)
  }

  const active = await getActivePlantaoSession(profissionalId)
  if (active && active.plantaoId !== plantaoId) {
    throw new ProfissionalAgendaError(
      'Encerre o plantão em andamento antes de entrar em outro.',
      'CONFLICT',
      409,
    )
  }

  if (active?.plantaoId === plantaoId) {
    return active
  }

  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .insert({
      plantao_id: plantaoId,
      profissional_id: profissionalId,
      slot_id: plantao.slot_id,
    })
    .select('id, plantao_id, entered_at, ended_at, summary')
    .single()

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_plantao_sessoes')) {
      throw new ProfissionalAgendaError(
        'Módulo de sessão de plantão indisponível. Aplique a migration profissional_plantao_sessoes.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    }
    throw error
  }

  await supabaseAdmin
    .from('usuarios_profissionais')
    .update({ status_plantao: 'disponivel' })
    .eq('id', profissionalId)

  return mapSessaoRow(data as SessaoRow)
}

export type EndProfissionalPlantaoOptions = {
  endedAt?: string
  encerramentoAutomatico?: boolean
}

export async function endProfissionalPlantao(
  profissionalId: string,
  plantaoId: string,
  summary: ProfissionalAgendaEndShiftSummaryInput,
  options?: EndProfissionalPlantaoOptions,
): Promise<ProfissionalAgendaActiveSessionApi> {
  await assertPlantaoBelongsToProfissional(profissionalId, plantaoId)

  const { data: sessao, error: loadError } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select('id, plantao_id, entered_at, ended_at, summary')
    .eq('profissional_id', profissionalId)
    .eq('plantao_id', plantaoId)
    .is('ended_at', null)
    .maybeSingle()

  if (loadError) {
    if (isMissingSupabaseResource(loadError, 'profissional_plantao_sessoes')) {
      throw new ProfissionalAgendaError(
        'Módulo de sessão de plantão indisponível.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    }
    throw loadError
  }

  if (!sessao) {
    throw new ProfissionalAgendaError('Nenhuma sessão ativa para este plantão.', 'NOT_FOUND', 404)
  }

  const endedAt = options?.endedAt ?? new Date().toISOString()
  const summaryPayload = {
    ...summary,
    encerramentoFormal: true,
    ...(options?.encerramentoAutomatico ? { encerramentoAutomatico: true } : {}),
  }
  const { data, error } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .update({
      ended_at: endedAt,
      summary: summaryPayload,
    })
    .eq('id', sessao.id)
    .select('id, plantao_id, entered_at, ended_at, summary')
    .single()

  if (error) throw error

  await supabaseAdmin
    .from('usuarios_profissionais')
    .update({ status_plantao: 'indisponivel' })
    .eq('id', profissionalId)

  await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .update({ status: 'realizado' })
    .eq('id', plantaoId)
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])

  return mapSessaoRow(data as SessaoRow)
}

function mapSessaoRow(row: SessaoRow): ProfissionalAgendaActiveSessionApi {
  const summary = row.summary ?? undefined
  return {
    shiftId: String(row.plantao_id),
    plantaoId: String(row.plantao_id),
    enteredAt: String(row.entered_at),
    ...(row.ended_at ? { endedAt: String(row.ended_at) } : {}),
    ...(summary ? { summary } : {}),
  }
}
