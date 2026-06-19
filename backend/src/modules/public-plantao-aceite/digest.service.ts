import { supabaseAdmin } from '../../db/supabase.js'
import { resolveSlotTimestampIso } from '../../lib/escalaDateTime.js'
import { createOpaqueToken, hashOpaqueToken } from '../../lib/password.js'
import { PublicPlantaoAceiteError } from './errors.js'

export type DigestConviteRow = {
  id: string
  profissional_id: string | null
  slot_ids: string[]
  expira_em: string | null
  revogado_em: string | null
}

function resolveDigestExpiryFromSlots(
  slots: Array<{ data: string; hora_inicio: string }>,
): string | null {
  if (slots.length === 0) return null

  let latestMs = 0
  for (const slot of slots) {
    const ms = new Date(resolveSlotTimestampIso(slot.data, slot.hora_inicio)).getTime()
    if (ms > latestMs) latestMs = ms
  }

  return latestMs > 0 ? new Date(latestMs).toISOString() : null
}

export async function resolveDigestByToken(token: string): Promise<DigestConviteRow> {
  const tokenHash = hashOpaqueToken(token.trim())

  const { data, error } = await supabaseAdmin
    .from('escala_plantao_convites_digest')
    .select('id, profissional_id, slot_ids, expira_em, revogado_em')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!data || data.revogado_em) {
    throw new PublicPlantaoAceiteError(
      'Este link de vagas não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  if (data.expira_em && new Date(String(data.expira_em)).getTime() <= Date.now()) {
    throw new PublicPlantaoAceiteError(
      'O prazo para aceitar estas vagas já encerrou.',
      'EXPIRED',
      410,
    )
  }

  const slotIds = Array.isArray(data.slot_ids)
    ? data.slot_ids.map((id) => String(id)).filter(Boolean)
    : []

  if (slotIds.length === 0) {
    throw new PublicPlantaoAceiteError(
      'Este link de vagas não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  return {
    id: String(data.id),
    profissional_id: data.profissional_id ? String(data.profissional_id) : null,
    slot_ids: slotIds,
    expira_em: data.expira_em ? String(data.expira_em) : null,
    revogado_em: data.revogado_em ? String(data.revogado_em) : null,
  }
}

export async function issueDigestConvite(input: {
  profissionalId: string
  slotIds: string[]
  slotsForExpiry: Array<{ data: string; hora_inicio: string }>
}): Promise<string> {
  const slotIds = [...new Set(input.slotIds.map((id) => id.trim()).filter(Boolean))]
  if (slotIds.length === 0) {
    throw new Error('issueDigestConvite requer ao menos um slot.')
  }

  const now = new Date().toISOString()
  const { error: revokeError } = await supabaseAdmin
    .from('escala_plantao_convites_digest')
    .update({ revogado_em: now })
    .eq('profissional_id', input.profissionalId)
    .is('revogado_em', null)

  if (revokeError) throw revokeError

  const token = createOpaqueToken()
  const tokenHash = hashOpaqueToken(token)
  const expiraEm = resolveDigestExpiryFromSlots(input.slotsForExpiry)

  const { error: insertError } = await supabaseAdmin.from('escala_plantao_convites_digest').insert({
    profissional_id: input.profissionalId,
    slot_ids: slotIds,
    token_hash: tokenHash,
    expira_em: expiraEm,
  })

  if (insertError) throw insertError

  return token
}

export async function markDigestNotificado(digestId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('escala_plantao_convites_digest')
    .update({ notificado_em: new Date().toISOString() })
    .eq('id', digestId)

  if (error) throw error
}

export async function findDigestIdByProfissionalId(
  profissionalId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantao_convites_digest')
    .select('id')
    .eq('profissional_id', profissionalId)
    .is('revogado_em', null)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.id ? String(data.id) : null
}

export async function revokeDigestsForSlotIds(slotIds: string[]): Promise<void> {
  if (slotIds.length === 0) return

  const { data, error } = await supabaseAdmin
    .from('escala_plantao_convites_digest')
    .select('id, slot_ids')
    .is('revogado_em', null)
    .overlaps('slot_ids', slotIds)

  if (error) throw error

  const digestIdsToRevoke = (data ?? [])
    .filter((row) => {
      const ids = Array.isArray(row.slot_ids) ? row.slot_ids.map(String) : []
      return ids.some((id) => slotIds.includes(id))
    })
    .map((row) => String(row.id))

  if (digestIdsToRevoke.length === 0) return

  const now = new Date().toISOString()
  const { error: revokeError } = await supabaseAdmin
    .from('escala_plantao_convites_digest')
    .update({ revogado_em: now })
    .in('id', digestIdsToRevoke)

  if (revokeError) throw revokeError
}

export async function assertSlotInDigest(digest: DigestConviteRow, slotId: string): Promise<void> {
  if (!digest.slot_ids.includes(slotId)) {
    throw new PublicPlantaoAceiteError(
      'Esta vaga não faz parte do link informado.',
      'NOT_FOUND',
      404,
    )
  }
}
