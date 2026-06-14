import { supabaseAdmin } from '../../db/supabase.js'
import { createOpaqueToken, hashOpaqueToken } from '../../lib/password.js'
import { UbtAuthError, verifyUbtAuthorizationPin } from './service.js'

const LGPD_TTL_MINUTES = 30

function lgpdExpiresAt(): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() + LGPD_TTL_MINUTES)
  return date.toISOString()
}

export async function unlockUbtLgpdSession(
  userId: string,
  pin: string,
): Promise<{ lgpdUnlockToken: string; expiresAt: string }> {
  await verifyUbtAuthorizationPin(userId, pin)

  const lgpdUnlockToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(lgpdUnlockToken)
  const expiresAt = lgpdExpiresAt()

  await supabaseAdmin
    .from('ubt_lgpd_unlocks')
    .delete()
    .eq('usuario_ubt_id', userId)
    .lt('expira_em', new Date().toISOString())

  const { error } = await supabaseAdmin.from('ubt_lgpd_unlocks').insert({
    usuario_ubt_id: userId,
    hash_token: tokenHash,
    expira_em: expiresAt,
  })

  if (error) throw error

  return { lgpdUnlockToken, expiresAt }
}

export async function isUbtLgpdUnlockActive(
  userId: string,
  lgpdUnlockToken: string,
): Promise<boolean> {
  if (!lgpdUnlockToken.trim()) return false

  const tokenHash = hashOpaqueToken(lgpdUnlockToken)
  const { data, error } = await supabaseAdmin
    .from('ubt_lgpd_unlocks')
    .select('id, expira_em')
    .eq('usuario_ubt_id', userId)
    .eq('hash_token', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!data) return false

  if (new Date(String(data.expira_em)).getTime() <= Date.now()) {
    await supabaseAdmin.from('ubt_lgpd_unlocks').delete().eq('id', data.id)
    return false
  }

  return true
}

export async function revokeUbtLgpdUnlocks(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ubt_lgpd_unlocks')
    .delete()
    .eq('usuario_ubt_id', userId)

  if (error) throw error
}

export async function revokeUbtLgpdUnlock(userId: string, lgpdUnlockToken: string): Promise<void> {
  if (!lgpdUnlockToken.trim()) return

  const tokenHash = hashOpaqueToken(lgpdUnlockToken)
  const { error } = await supabaseAdmin
    .from('ubt_lgpd_unlocks')
    .delete()
    .eq('usuario_ubt_id', userId)
    .eq('hash_token', tokenHash)

  if (error) throw error
}

export function mapUbtLgpdError(error: unknown): { statusCode: number; body: { error: string; code?: string } } {
  if (error instanceof UbtAuthError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Não foi possível validar o desbloqueio LGPD.' },
  }
}
