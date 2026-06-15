import { supabaseAdmin } from '../../db/supabase.js'
import { resolveSlotTimestampIso } from '../../lib/escalaDateTime.js'
import { createOpaqueToken, hashOpaqueToken } from '../../lib/password.js'
import { PublicPlantaoAceiteError } from './errors.js'

export type ConviteAceiteRow = {
  id: string
  slot_id: string
  expira_em: string | null
  revogado_em: string | null
}

export async function resolveConviteByToken(token: string): Promise<ConviteAceiteRow> {
  const tokenHash = hashOpaqueToken(token.trim())

  const { data, error } = await supabaseAdmin
    .from('escala_slot_convites_aceite')
    .select('id, slot_id, expira_em, revogado_em')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!data || data.revogado_em) {
    throw new PublicPlantaoAceiteError(
      'Este link de aceite não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  if (data.expira_em && new Date(String(data.expira_em)).getTime() <= Date.now()) {
    throw new PublicPlantaoAceiteError(
      'O prazo para aceitar este plantão já encerrou.',
      'EXPIRED',
      410,
    )
  }

  return {
    id: String(data.id),
    slot_id: String(data.slot_id),
    expira_em: data.expira_em ? String(data.expira_em) : null,
    revogado_em: data.revogado_em ? String(data.revogado_em) : null,
  }
}

export async function issueFreshConviteForSlot(slot: {
  id: string
  data: string
  hora_inicio: string
}): Promise<string> {
  await revokeConvitesForSlotIds([slot.id])

  const token = createOpaqueToken()
  const tokenHash = hashOpaqueToken(token)
  const expiraEm = resolveSlotTimestampIso(slot.data, slot.hora_inicio)

  const { error: insertError } = await supabaseAdmin.from('escala_slot_convites_aceite').insert({
    slot_id: slot.id,
    token_hash: tokenHash,
    expira_em: expiraEm,
  })

  if (insertError) throw insertError

  return token
}

/** @deprecated Use issueFreshConviteForSlot — mantido para compatibilidade interna. */
export async function createConviteForSlot(slot: {
  id: string
  data: string
  hora_inicio: string
}): Promise<{ token: string; created: boolean }> {
  const token = await issueFreshConviteForSlot(slot)
  return { token, created: true }
}

export async function markConviteNotificado(conviteId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('escala_slot_convites_aceite')
    .update({ notificado_em: new Date().toISOString() })
    .eq('id', conviteId)

  if (error) throw error
}

export async function findConviteIdBySlotId(slotId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('escala_slot_convites_aceite')
    .select('id')
    .eq('slot_id', slotId)
    .is('revogado_em', null)
    .maybeSingle()

  if (error) throw error
  return data?.id ? String(data.id) : null
}

export async function revokeConvitesForSlotIds(slotIds: string[]): Promise<void> {
  if (slotIds.length === 0) return

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('escala_slot_convites_aceite')
    .update({ revogado_em: now })
    .in('slot_id', slotIds)
    .is('revogado_em', null)

  if (error) throw error
}
