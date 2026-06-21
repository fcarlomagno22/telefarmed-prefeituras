import { invalidateAuthSessionCache } from '../../lib/cache/authSessionCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { signProfissionalAccessToken } from '../../lib/jwt.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  verifyPassword,
} from '../../lib/password.js'
import {
  type ProfissionalSexo,
  type ProfissionalUserPublic,
  type UsuarioProfissionalRow,
  toProfissionalUserPublic,
} from './types.js'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
const REFRESH_TTL_DAYS = 7

const USUARIO_PROFISSIONAL_COLUMNS =
  'id, cpf, nome, email, especialidade, sexo, senha_hash, status, permissoes_paginas, tentativas_login_falhas, bloqueado_ate, ultimo_login_em'

export class ProfissionalAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_CREDENTIALS'
      | 'USER_INACTIVE'
      | 'ACCOUNT_LOCKED'
      | 'INVALID_REFRESH'
      | 'NOT_FOUND',
    readonly statusCode = 401,
  ) {
    super(message)
    this.name = 'ProfissionalAuthError'
  }
}

function refreshExpiresAt(): string {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TTL_DAYS)
  return date.toISOString()
}

function parseProfissionalSexo(value: unknown): ProfissionalSexo {
  if (value === 'masculino' || value === 'feminino' || value === 'nao_informado') {
    return value
  }
  return 'nao_informado'
}

function parseUsuarioRow(row: Record<string, unknown>): UsuarioProfissionalRow {
  return {
    id: String(row.id),
    cpf: String(row.cpf),
    nome: String(row.nome),
    email: row.email == null ? null : String(row.email),
    especialidade: String(row.especialidade ?? ''),
    sexo: parseProfissionalSexo(row.sexo),
    senha_hash: String(row.senha_hash),
    status: row.status as UsuarioProfissionalRow['status'],
    tentativas_login_falhas: Number(row.tentativas_login_falhas ?? 0),
    bloqueado_ate: row.bloqueado_ate ? new Date(String(row.bloqueado_ate)) : null,
    ultimo_login_em: row.ultimo_login_em ? new Date(String(row.ultimo_login_em)) : null,
  }
}

type UsuarioProfissionalLookup = {
  row: UsuarioProfissionalRow
  permissoesPaginas: unknown
}

async function findUserByCpf(cpf: string): Promise<UsuarioProfissionalLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select(USUARIO_PROFISSIONAL_COLUMNS)
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

async function findUserById(id: string): Promise<UsuarioProfissionalLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select(USUARIO_PROFISSIONAL_COLUMNS)
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

function isLocked(user: UsuarioProfissionalRow): boolean {
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

  const { error } = await supabaseAdmin.from('usuarios_profissionais').update(patch).eq('id', userId)
  if (error) throw error
}

async function clearFailedLogins(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      ultimo_login_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

export async function loginProfissional(input: {
  cpf: string
  password: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: ProfissionalUserPublic }> {
  let cpf: string
  try {
    cpf = normalizeCpf(input.cpf)
  } catch {
    throw new ProfissionalAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const lookup = await findUserByCpf(cpf)
  if (!lookup) {
    throw new ProfissionalAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const user = lookup.row

  if (user.status !== 'ativo') {
    throw new ProfissionalAuthError('Usuário inativo. Contate o suporte.', 'USER_INACTIVE', 403)
  }

  if (isLocked(user)) {
    throw new ProfissionalAuthError(
      'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.',
      'ACCOUNT_LOCKED',
      423,
    )
  }

  const passwordOk = await verifyPassword(input.password, user.senha_hash)
  if (!passwordOk) {
    await registerFailedLogin(user.id, user.tentativas_login_falhas)
    throw new ProfissionalAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  await clearFailedLogins(user.id)

  const accessToken = await signProfissionalAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
  })

  const refreshToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(refreshToken)

  const { error: sessionError } = await supabaseAdmin.from('sessoes_refresh_profissional').insert({
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
    user: toProfissionalUserPublic(
      refreshed?.row ?? user,
      refreshed?.permissoesPaginas ?? lookup.permissoesPaginas,
    ),
  }
}

export async function refreshProfissionalSession(input: {
  refreshToken: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: ProfissionalUserPublic }> {
  const tokenHash = hashOpaqueToken(input.refreshToken)

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_profissional')
    .select('id, usuario_id, expira_em')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  if (!session || new Date(String(session.expira_em)).getTime() <= Date.now()) {
    throw new ProfissionalAuthError('Sessão expirada. Faça login novamente.', 'INVALID_REFRESH')
  }

  const lookup = await findUserById(String(session.usuario_id))
  if (!lookup || lookup.row.status !== 'ativo') {
    throw new ProfissionalAuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  const user = lookup.row
  const newRefreshToken = createOpaqueToken()
  const newTokenHash = hashOpaqueToken(newRefreshToken)

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sessoes_refresh_profissional')
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
    .from('sessoes_refresh_profissional')
    .update({
      revogado_em: new Date().toISOString(),
      substituido_por_id: inserted.id,
    })
    .eq('id', session.id)

  if (revokeError) throw revokeError

  const accessToken = await signProfissionalAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: toProfissionalUserPublic(user, lookup.permissoesPaginas),
  }
}

export async function logoutProfissional(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return

  const tokenHash = hashOpaqueToken(refreshToken)
  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_profissional')
    .select('usuario_id')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  const { error } = await supabaseAdmin
    .from('sessoes_refresh_profissional')
    .update({ revogado_em: new Date().toISOString() })
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)

  if (error) throw error

  if (sessionRow?.usuario_id) {
    invalidateAuthSessionCache('profissional', String(sessionRow.usuario_id))
  }
}

export async function getProfissionalUserById(id: string): Promise<ProfissionalUserPublic> {
  const lookup = await findUserById(id)
  if (!lookup) {
    throw new ProfissionalAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  return toProfissionalUserPublic(lookup.row, lookup.permissoesPaginas)
}
