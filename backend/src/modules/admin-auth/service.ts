import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from '../../lib/password.js'
import { signAccessToken } from '../../lib/jwt.js'
import { type AdminUserPublic, type UsuarioAdminRow, toAdminUserPublic } from './types.js'

const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
const REFRESH_TTL_DAYS = 7

const USUARIO_ADMIN_COLUMNS =
  'id, cpf, nome, email, senha_hash, nivel_acesso, departamento, eh_master, status, permissoes_paginas, tentativas_login_falhas, bloqueado_ate, ultimo_login_em'

export class AuthError extends Error {
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
    this.name = 'AuthError'
  }
}

function refreshExpiresAt(): string {
  const date = new Date()
  date.setDate(date.getDate() + REFRESH_TTL_DAYS)
  return date.toISOString()
}

function parseUsuarioRow(row: Record<string, unknown>): UsuarioAdminRow {
  return {
    id: String(row.id),
    cpf: String(row.cpf),
    nome: String(row.nome),
    email: row.email == null ? null : String(row.email),
    senha_hash: String(row.senha_hash),
    nivel_acesso: String(row.nivel_acesso),
    departamento: String(row.departamento),
    eh_master: Boolean(row.eh_master),
    status: row.status as UsuarioAdminRow['status'],
    tentativas_login_falhas: Number(row.tentativas_login_falhas ?? 0),
    bloqueado_ate: row.bloqueado_ate ? new Date(String(row.bloqueado_ate)) : null,
    ultimo_login_em: row.ultimo_login_em ? new Date(String(row.ultimo_login_em)) : null,
  }
}

type UsuarioAdminLookup = {
  row: UsuarioAdminRow
  permissoesPaginas: unknown
}

async function findUserByCpf(cpf: string): Promise<UsuarioAdminLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_admin')
    .select(USUARIO_ADMIN_COLUMNS)
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

async function findUserById(id: string): Promise<UsuarioAdminLookup | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_admin')
    .select(USUARIO_ADMIN_COLUMNS)
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

function isLocked(user: UsuarioAdminRow): boolean {
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

  const { error } = await supabaseAdmin.from('usuarios_admin').update(patch).eq('id', userId)
  if (error) throw error
}

async function clearFailedLogins(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('usuarios_admin')
    .update({
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      ultimo_login_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

export async function loginAdmin(input: {
  cpf: string
  password: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: AdminUserPublic }> {
  const cpf = normalizeCpf(input.cpf)
  const lookup = await findUserByCpf(cpf)

  if (!lookup) {
    throw new AuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const user = lookup.row

  if (user.status !== 'ativo') {
    throw new AuthError('Usuário inativo. Contate o administrador.', 'USER_INACTIVE', 403)
  }

  if (isLocked(user)) {
    throw new AuthError(
      'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.',
      'ACCOUNT_LOCKED',
      423,
    )
  }

  const passwordOk = await verifyPassword(input.password, user.senha_hash)
  if (!passwordOk) {
    await registerFailedLogin(user.id, user.tentativas_login_falhas)
    throw new AuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  await clearFailedLogins(user.id)

  const accessToken = await signAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
    accessLevel: user.nivel_acesso,
    isMaster: user.eh_master,
  })

  const refreshToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(refreshToken)

  const { error: sessionError } = await supabaseAdmin.from('sessoes_refresh_admin').insert({
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
    user: toAdminUserPublic(
      refreshed?.row ?? user,
      refreshed?.permissoesPaginas ?? lookup.permissoesPaginas,
    ),
  }
}

export async function refreshAdminSession(input: {
  refreshToken: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: AdminUserPublic }> {
  const tokenHash = hashOpaqueToken(input.refreshToken)

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_admin')
    .select('id, usuario_id, expira_em')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  if (!session || new Date(String(session.expira_em)).getTime() <= Date.now()) {
    throw new AuthError('Sessão expirada. Faça login novamente.', 'INVALID_REFRESH')
  }

  const lookup = await findUserById(String(session.usuario_id))
  if (!lookup || lookup.row.status !== 'ativo') {
    throw new AuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  const user = lookup.row

  const newRefreshToken = createOpaqueToken()
  const newTokenHash = hashOpaqueToken(newRefreshToken)

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sessoes_refresh_admin')
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
    .from('sessoes_refresh_admin')
    .update({
      revogado_em: new Date().toISOString(),
      substituido_por_id: inserted.id,
    })
    .eq('id', session.id)

  if (revokeError) throw revokeError

  const accessToken = await signAccessToken({
    sub: user.id,
    cpf: user.cpf,
    nome: user.nome,
    accessLevel: user.nivel_acesso,
    isMaster: user.eh_master,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: toAdminUserPublic(user, lookup.permissoesPaginas),
  }
}

export async function logoutAdmin(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return

  const tokenHash = hashOpaqueToken(refreshToken)
  const { error } = await supabaseAdmin
    .from('sessoes_refresh_admin')
    .update({ revogado_em: new Date().toISOString() })
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)

  if (error) throw error
}

export async function verifyAdminAuthorizationPin(adminId: string, pin: string): Promise<void> {
  if (!/^\d{6}$/.test(pin)) {
    throw new AuthError('Senha de autorização inválida.', 'INVALID_PIN')
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios_admin')
    .select('pin_autorizacao_hash, status')
    .eq('id', adminId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'ativo') {
    throw new AuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  const pinHash = data.pin_autorizacao_hash ? String(data.pin_autorizacao_hash) : null
  if (!pinHash) {
    throw new AuthError(
      'Configure sua senha de autorização de 6 dígitos no seu cadastro antes de continuar.',
      'PIN_NOT_CONFIGURED',
      400,
    )
  }

  const pinOk = await verifyPassword(pin, pinHash)
  if (!pinOk) {
    throw new AuthError('Senha de autorização incorreta.', 'INVALID_PIN')
  }
}

export async function getAdminById(id: string): Promise<AdminUserPublic> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_admin')
    .select('id, cpf, nome, email, senha_hash, nivel_acesso, departamento, eh_master, status, permissoes_paginas, tentativas_login_falhas, bloqueado_ate, ultimo_login_em')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new AuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  const row = parseUsuarioRow(data as Record<string, unknown>)
  return toAdminUserPublic(row, (data as Record<string, unknown>).permissoes_paginas)
}

export async function ensureMasterUser(input: {
  cpf: string
  nome: string
  email?: string
  password: string
}): Promise<void> {
  const cpf = normalizeCpf(input.cpf)
  const passwordHash = await hashPassword(input.password)

  const { error } = await supabaseAdmin.from('usuarios_admin').upsert(
    {
      cpf,
      nome: input.nome,
      email: input.email ?? null,
      senha_hash: passwordHash,
      nivel_acesso: 'administrador',
      departamento: 'diretoria',
      eh_master: true,
      status: 'ativo',
    },
    { onConflict: 'cpf', ignoreDuplicates: true },
  )

  if (error) throw error
}
