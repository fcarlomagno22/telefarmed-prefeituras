import { supabaseAdmin } from '../../db/supabase.js'
import { formatLocalTimestampAsIso } from '../../lib/escalaDateTime.js'
import {
  assertNoScheduleConflict,
  loadSlotDisponivelForClaim,
} from './disponiveis.service.js'
import { ProfissionalEscalaError } from './errors.js'
import { formatProfissionalSlotRow } from './formatters.js'
import type { ProfissionalEscalaContext, ProfissionalEscalaSlotDto } from './types.js'

export type InscreverProfissionalEscalaResult = {
  slot: ProfissionalEscalaSlotDto
  plantaoId: string
  inscricaoId: string
}

async function assertNotAlreadyClaimed(
  profissionalId: string,
  slotId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id')
    .eq('profissional_id', profissionalId)
    .eq('slot_id', slotId)
    .in('status', ['confirmado', 'realizado'])
    .maybeSingle()

  if (error) throw error
  if (data) {
    throw new ProfissionalEscalaError(
      'Você já reservou este plantão.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }
}

export async function inscreverProfissionalEscalaSlot(
  ctx: ProfissionalEscalaContext,
  slotId: string,
): Promise<InscreverProfissionalEscalaResult> {
  await assertNotAlreadyClaimed(ctx.profissionalId, slotId)

  const slotRow = await loadSlotDisponivelForClaim(slotId, ctx)
  const startAt = formatLocalTimestampAsIso(String(slotRow.inicio_em))
  const endAt = formatLocalTimestampAsIso(String(slotRow.fim_em))

  await assertNoScheduleConflict(ctx.profissionalId, startAt, endAt, slotId)

  const now = new Date().toISOString()

  const { data: inscricao, error: inscricaoError } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .insert({
      slot_id: slotId,
      profissional_id: ctx.profissionalId,
      status: 'pendente',
      inscrito_em: now,
    })
    .select('id')
    .single()

  if (inscricaoError) {
    if (inscricaoError.code === '23505') {
      throw new ProfissionalEscalaError(
        'Você já possui inscrição neste plantão.',
        'SLOT_UNAVAILABLE',
        409,
      )
    }
    throw inscricaoError
  }

  const inscricaoId = String(inscricao.id)

  const { count: confirmedCount, error: countError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slotId)
    .in('status', ['confirmado', 'realizado'])

  if (countError) throw countError
  if ((confirmedCount ?? 0) >= Number(slotRow.vagas ?? 0)) {
    await supabaseAdmin.from('escala_inscricoes_profissional').delete().eq('id', inscricaoId)
    throw new ProfissionalEscalaError(
      'Não foi possível reservar este plantão.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  const { data: plantao, error: plantaoError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .insert({
      slot_id: slotId,
      profissional_id: ctx.profissionalId,
      inscricao_id: inscricaoId,
      status: 'confirmado',
      confirmado_em: now,
    })
    .select('id')
    .single()

  if (plantaoError) {
    await supabaseAdmin
      .from('escala_inscricoes_profissional')
      .delete()
      .eq('id', inscricaoId)

    if (plantaoError.code === '23505') {
      throw new ProfissionalEscalaError(
        'Não foi possível reservar este plantão.',
        'SLOT_UNAVAILABLE',
        409,
      )
    }
    throw plantaoError
  }

  const { error: acceptError } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .update({
      status: 'aceita',
      respondido_em: now,
      atualizado_em: now,
    })
    .eq('id', inscricaoId)

  if (acceptError) throw acceptError

  const slot = formatProfissionalSlotRow(slotRow, {
    status: 'reservado_mim',
    inscricaoId,
    plantaoId: String(plantao.id),
  })

  return {
    slot: {
      ...slot,
      vacancies: Math.max(0, slot.vacancies - 1),
    },
    plantaoId: String(plantao.id),
    inscricaoId,
  }
}
