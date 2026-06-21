import { invalidateAuthSessionCache } from '../../lib/cache/authSessionCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { attachEntidadeBranding } from '../../lib/entidadeBranding/branding.service.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { signUbtAccessToken } from '../../lib/jwt.js'
import {
  assertUbtSessionMatchesHost,
  TenantHostMismatchError,
} from '../../lib/tenant/loginHost.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  verifyPassword,
} from '../../lib/password.js'
import { type UbtUserPublic, type UsuarioUbtRow, toUbtUserPublic } from './types.js'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
const REFRESH_TTL_DAYS = 7

const USUARIO_UBT_COLUMNS =
  'id, cpf, nome, email, funcao, senha_hash, nivel_acesso, status, entidade_contratante_id, unidade_ubt_id, entidade_razao_social, municipio, uf, unidade_ubt_nome, permissoes_sistema, tentativas_login_falhas, bloqueado_ate, ultimo_login_em'

export class UbtAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_CREDENTIALS'
      | 'USER_INACTIVE'
      | 'ACCOUNT_LOCKED'
      | 'INVALID_REFRESH'
      | 'NOT_FOUND'
      | 'INVALID_PIN'
      | 'PIN_NOT_CONFIGURED'
      | 'TENANT_HOST_MISMATCH',
    readonly statusCode = 401,
  ) {
    super(message)
    this.name = 'UbtAuthError'
  }
}

function refreshExpiresAt(): string {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TTL_DAYS)
  return date.toISOString()
}

function parseUsuarioRow(row: Record<string, unknown>): UsuarioUbtRow {
  return {
    id: String(row.id),
    cpf: String(row.cpf),
    nome: String(row.nome),
    email: row.email == null ? null : String(row.email),
    funcao: String(row.funcao ?? ''),
    senha_hash: String(row.senha_hash),
    nivel_acesso: String(row.nivel_acesso),
    status: row.status as UsuarioUbtRow['status'],
    entidade_contratante_id: String(row.entidade_contratante_id),
    unidade_ubt_id: String(row.unidade_ubt_id),
    entidade_razao_social: String(row.entidade_razao_social),
    municipio: String(row.municipio),
    uf: String(row.uf),
    unidade_ubt_nome: String(row.unidade_ubt_nome),
    tentativas_login_falhas: Number(row.tentativas_login_falhas ?? 0),
    bloqueado_ate: row.bloqueado_ate ? new Date(String(row.bloqueado_ate)) : null,
    ultimo_login_em: row.ultimo_login_em ? new Date(String(row.ultimo_login_em)) : null,
  }
}

type UsuarioUbtLookup = {
  row: UsuarioUbtRow
  permissoesSistema: unknown
}

async function findUserByCpf(cpf: string): Promise<UsuarioUbtLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select(USUARIO_UBT_COLUMNS)
    .eq('cpf', cpf)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const record = data as Record<string, unknown>
  return {
    row: parseUsuarioRow(record),
    permissoesSistema: record.permissoes_sistema,
  }
}

async function findUserById(id: string): Promise<UsuarioUbtLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select(USUARIO_UBT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const record = data as Record<string, unknown>
  return {
    row: parseUsuarioRow(record),
    permissoesSistema: record.permissoes_sistema,
  }
}

function isLocked(user: UsuarioUbtRow): boolean {
  return Boolean(user.bloqueado_ate && user.bloqueado_ate.getTime() > Date.now())
}

async function registerFailedLogin(userId: string, attempts: number): Promise<void> {
  const nextAttempts = attempts + 1
  const lockAccount = nextAttempts >= MAX_FAILED_ATTEMPTS

  const patch: Record<string, unknown> = {
    tentativas_login_falhas: nextAttempts,
    atualizado_em: new Date().toISOString(),
  }

  if (lockAccount) {
    patch.bloqueado_ate = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
  }

  const { error } = await supabaseAdmin.from('usuarios_ubt').update(patch).eq('id', userId)
  if (error) throw error
}

async function clearFailedLogins(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('usuarios_ubt')
    .update({
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      ultimo_login_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

export async function loginUbt(input: {
  cpf: string
  password: string
  tenantHost?: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: UbtUserPublic }> {
  let cpf: string
  try {
    cpf = normalizeCpf(input.cpf)
  } catch {
    throw new UbtAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const lookup = await findUserByCpf(cpf)

  if (!lookup) {
    throw new UbtAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const user = lookup.row

  if (user.status !== 'ativo') {
    throw new UbtAuthError('Usuário inativo. Contate o administrador.', 'USER_INACTIVE', 403)
  }

  if (isLocked(user)) {
    throw new UbtAuthError(
      'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.',
      'ACCOUNT_LOCKED',
      423,
    )
  }

  const passwordOk = await verifyPassword(input.password, user.senha_hash)
  if (!passwordOk) {
    await registerFailedLogin(user.id, user.tentativas_login_falhas)
    throw new UbtAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  try {
    await assertUbtSessionMatchesHost(user.unidade_ubt_id, input.tenantHost)
  } catch (error) {
    if (error instanceof TenantHostMismatchError) {
      throw new UbtAuthError(error.message, 'TENANT_HOST_MISMATCH', 403)
    }
    throw error
  }

  await clearFailedLogins(user.id)

  const accessToken = await signUbtAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
    accessLevel: user.nivel_acesso,
    entidadeContratanteId: user.entidade_contratante_id,
    unidadeUbtId: user.unidade_ubt_id,
  })

  const refreshToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(refreshToken)

  const { error: sessionError } = await supabaseAdmin.from('sessoes_refresh_ubt').insert({
    usuario_id: user.id,
    hash_token: tokenHash,
    expira_em: refreshExpiresAt(),
    agente_usuario: input.userAgent ?? null,
    endereco_ip: input.ipAddress ?? null,
  })

  if (sessionError) throw sessionError

  const refreshed = await findUserById(user.id)
  return {
    accessToken,
    refreshToken,
    user: await attachEntidadeBranding(
      toUbtUserPublic(
        refreshed?.row ?? user,
        refreshed?.permissoesSistema ?? lookup.permissoesSistema,
      ),
    ),
  }
}

export async function refreshUbtSession(input: {
  refreshToken: string
  tenantHost?: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: UbtUserPublic }> {
  const tokenHash = hashOpaqueToken(input.refreshToken)

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_ubt')
    .select('id, usuario_id, expira_em')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  if (!session || new Date(String(session.expira_em)).getTime() <= Date.now()) {
    throw new UbtAuthError('Sessão expirada. Faça login novamente.', 'INVALID_REFRESH')
  }

  const lookup = await findUserById(String(session.usuario_id))
  if (!lookup || lookup.row.status !== 'ativo') {
    throw new UbtAuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  const user = lookup.row

  try {
    await assertUbtSessionMatchesHost(user.unidade_ubt_id, input.tenantHost)
  } catch (error) {
    if (error instanceof TenantHostMismatchError) {
      throw new UbtAuthError(error.message, 'TENANT_HOST_MISMATCH', 403)
    }
    throw error
  }

  const newRefreshToken = createOpaqueToken()
  const newTokenHash = hashOpaqueToken(newRefreshToken)

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sessoes_refresh_ubt')
    .insert({
      usuario_id: user.id,
      hash_token: newTokenHash,
      expira_em: refreshExpiresAt(),
      agente_usuario: input.userAgent ?? null,
      endereco_ip: input.ipAddress ?? null,
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  const { error: revokeError } = await supabaseAdmin
    .from('sessoes_refresh_ubt')
    .update({
      revogado_em: new Date().toISOString(),
      substituido_por_id: inserted.id,
    })
    .eq('id', session.id)

  if (revokeError) throw revokeError

  const accessToken = await signUbtAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
    accessLevel: user.nivel_acesso,
    entidadeContratanteId: user.entidade_contratante_id,
    unidadeUbtId: user.unidade_ubt_id,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: await attachEntidadeBranding(toUbtUserPublic(user, lookup.permissoesSistema)),
  }
}

export async function logoutUbt(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return

  const tokenHash = hashOpaqueToken(refreshToken)
  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_ubt')
    .select('id, usuario_ubt_id')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  const { error } = await supabaseAdmin
    .from('sessoes_refresh_ubt')
    .update({ revogado_em: new Date().toISOString() })
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)

  if (error) throw error

  if (sessionRow?.usuario_ubt_id) {
    const userId = String(sessionRow.usuario_ubt_id)
    invalidateAuthSessionCache('ubt', userId)
    const { revokeUbtLgpdUnlocks } = await import('./lgpd.service.js')
    await revokeUbtLgpdUnlocks(userId)
  }
}

export async function verifyUbtAuthorizationPin(userId: string, pin: string): Promise<void> {
  if (!/^\d{6}$/.test(pin)) {
    throw new UbtAuthError('Senha de autorização inválida.', 'INVALID_PIN')
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('pin_autorizacao_hash, status')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'ativo') {
    throw new UbtAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  const pinHash = data.pin_autorizacao_hash ? String(data.pin_autorizacao_hash) : null
  if (!pinHash) {
    throw new UbtAuthError(
      'Configure sua senha de autorização de 6 dígitos no seu cadastro antes de continuar.',
      'PIN_NOT_CONFIGURED',
      400,
    )
  }

  const pinOk = await verifyPassword(pin, pinHash)
  if (!pinOk) {
    throw new UbtAuthError('Senha de autorização incorreta.', 'INVALID_PIN')
  }
}

export async function getUbtUserById(id: string): Promise<UbtUserPublic> {
  const lookup = await findUserById(id)
  if (!lookup) {
    throw new UbtAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  return attachEntidadeBranding(toUbtUserPublic(lookup.row, lookup.permissoesSistema))
}
