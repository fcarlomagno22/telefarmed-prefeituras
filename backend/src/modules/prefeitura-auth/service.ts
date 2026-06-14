import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  verifyPassword,
} from '../../lib/password.js'
import { signPrefeituraAccessToken } from '../../lib/jwt.js'
import { type PrefeituraUserPublic, type UsuarioPrefeituraRow, toPrefeituraUserPublic } from './types.js'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
const REFRESH_TTL_DAYS = 7

const USUARIO_PREFEITURA_COLUMNS =
  'id, cpf, nome, email, funcao, senha_hash, nivel_acesso, status, entidade_contratante_id, entidade_razao_social, municipio, uf, permissoes_paginas, tentativas_login_falhas, bloqueado_ate, ultimo_login_em'

export class PrefeituraAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_CREDENTIALS'
      | 'USER_INACTIVE'
      | 'ACCOUNT_LOCKED'
      | 'INVALID_REFRESH'
      | 'NOT_FOUND'
      | 'INVALID_PIN'
      | 'PIN_NOT_CONFIGURED',
    readonly statusCode = 401,
  ) {
    super(message)
    this.name = 'PrefeituraAuthError'
  }
}

function refreshExpiresAt(): string {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TTL_DAYS)
  return date.toISOString()
}

function parseUsuarioRow(row: Record<string, unknown>): UsuarioPrefeituraRow {
  return {
    id: String(row.id),
    cpf: String(row.cpf),
    nome: String(row.nome),
    email: row.email == null ? null : String(row.email),
    funcao: String(row.funcao ?? ''),
    senha_hash: String(row.senha_hash),
    nivel_acesso: String(row.nivel_acesso),
    status: row.status as UsuarioPrefeituraRow['status'],
    entidade_contratante_id: String(row.entidade_contratante_id),
    entidade_razao_social: String(row.entidade_razao_social),
    municipio: String(row.municipio),
    uf: String(row.uf),
    tentativas_login_falhas: Number(row.tentativas_login_falhas ?? 0),
    bloqueado_ate: row.bloqueado_ate ? new Date(String(row.bloqueado_ate)) : null,
    ultimo_login_em: row.ultimo_login_em ? new Date(String(row.ultimo_login_em)) : null,
  }
}

type UsuarioPrefeituraLookup = {
  row: UsuarioPrefeituraRow
  permissoesPaginas: unknown
}

async function findUserByCpf(cpf: string): Promise<UsuarioPrefeituraLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_prefeitura')
    .select(USUARIO_PREFEITURA_COLUMNS)
    .eq('cpf', cpf)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const record = data as Record<string, unknown>
  return {
    row: parseUsuarioRow(record),
    permissoesPaginas: record.permissoes_paginas,
  }
}

async function findUserById(id: string): Promise<UsuarioPrefeituraLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_prefeitura')
    .select(USUARIO_PREFEITURA_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const record = data as Record<string, unknown>
  return {
    row: parseUsuarioRow(record),
    permissoesPaginas: record.permissoes_paginas,
  }
}

function isLocked(user: UsuarioPrefeituraRow): boolean {
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

  const { error } = await supabaseAdmin.from('usuarios_prefeitura').update(patch).eq('id', userId)
  if (error) throw error
}

async function clearFailedLogins(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('usuarios_prefeitura')
    .update({
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      ultimo_login_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

export async function loginPrefeitura(input: {
  cpf: string
  password: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: PrefeituraUserPublic }> {
  let cpf: string
  try {
    cpf = normalizeCpf(input.cpf)
  } catch {
    throw new PrefeituraAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const lookup = await findUserByCpf(cpf)

  if (!lookup) {
    throw new PrefeituraAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const user = lookup.row

  if (user.status !== 'ativo') {
    throw new PrefeituraAuthError('Usuário inativo. Contate o administrador.', 'USER_INACTIVE', 403)
  }

  if (isLocked(user)) {
    throw new PrefeituraAuthError(
      'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.',
      'ACCOUNT_LOCKED',
      423,
    )
  }

  const passwordOk = await verifyPassword(input.password, user.senha_hash)
  if (!passwordOk) {
    await registerFailedLogin(user.id, user.tentativas_login_falhas)
    throw new PrefeituraAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  await clearFailedLogins(user.id)

  const accessToken = await signPrefeituraAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
    accessLevel: user.nivel_acesso,
    entidadeContratanteId: user.entidade_contratante_id,
  })

  const refreshToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(refreshToken)

  const { error: sessionError } = await supabaseAdmin.from('sessoes_refresh_prefeitura').insert({
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
    user: toPrefeituraUserPublic(
      refreshed?.row ?? user,
      refreshed?.permissoesPaginas ?? lookup.permissoesPaginas,
    ),
  }
}

export async function refreshPrefeituraSession(input: {
  refreshToken: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: PrefeituraUserPublic }> {
  const tokenHash = hashOpaqueToken(input.refreshToken)

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_prefeitura')
    .select('id, usuario_id, expira_em')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  if (!session || new Date(String(session.expira_em)).getTime() <= Date.now()) {
    throw new PrefeituraAuthError('Sessão expirada. Faça login novamente.', 'INVALID_REFRESH')
  }

  const lookup = await findUserById(String(session.usuario_id))
  if (!lookup || lookup.row.status !== 'ativo') {
    throw new PrefeituraAuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  const user = lookup.row

  const newRefreshToken = createOpaqueToken()
  const newTokenHash = hashOpaqueToken(newRefreshToken)

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sessoes_refresh_prefeitura')
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
    .from('sessoes_refresh_prefeitura')
    .update({
      revogado_em: new Date().toISOString(),
      substituido_por_id: inserted.id,
    })
    .eq('id', session.id)

  if (revokeError) throw revokeError

  const accessToken = await signPrefeituraAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
    accessLevel: user.nivel_acesso,
    entidadeContratanteId: user.entidade_contratante_id,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: toPrefeituraUserPublic(user, lookup.permissoesPaginas),
  }
}

export async function logoutPrefeitura(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return

  const tokenHash = hashOpaqueToken(refreshToken)
  const { error } = await supabaseAdmin
    .from('sessoes_refresh_prefeitura')
    .update({ revogado_em: new Date().toISOString() })
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)

  if (error) throw error
}

export async function verifyPrefeituraAuthorizationPin(
  userId: string,
  pin: string,
): Promise<void> {
  if (!/^\d{6}$/.test(pin)) {
    throw new PrefeituraAuthError('Senha de autorização inválida.', 'INVALID_PIN')
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios_prefeitura')
    .select('pin_autorizacao_hash, status')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'ativo') {
    throw new PrefeituraAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  const pinHash = data.pin_autorizacao_hash ? String(data.pin_autorizacao_hash) : null
  if (!pinHash) {
    throw new PrefeituraAuthError(
      'Configure sua senha de autorização de 6 dígitos no seu cadastro antes de continuar.',
      'PIN_NOT_CONFIGURED',
      400,
    )
  }

  const pinOk = await verifyPassword(pin, pinHash)
  if (!pinOk) {
    throw new PrefeituraAuthError('Senha de autorização incorreta.', 'INVALID_PIN')
  }
}

export async function getPrefeituraUserById(id: string): Promise<PrefeituraUserPublic> {
  const lookup = await findUserById(id)
  if (!lookup) {
    throw new PrefeituraAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  return toPrefeituraUserPublic(lookup.row, lookup.permissoesPaginas)
}
