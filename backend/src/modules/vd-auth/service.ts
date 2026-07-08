import { invalidateAuthSessionCache } from '../../lib/cache/authSessionCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { signVdPacienteAccessToken } from '../../lib/jwt.js'
import {
  createOpaqueToken,
  hashOpaqueToken,
  verifyPassword,
} from '../../lib/password.js'
import {
  assertVdSessionMatchesHost,
  resolveVdTenantFromHost,
  TenantHostMismatchError,
} from '../../lib/tenant/loginHost.js'
import { vdRefreshExpiresAt } from '../../lib/vdAuthSession.js'
import { getPacienteDetail } from '../admin-pacientes/pacientes.service.js'
import { mapPatientDetailToVdUserPublic } from '../vd-cadastro/user.mapper.js'
import type { VdPacienteUserPublic } from './types.js'

const MAX_FAILED_ATTEMPTS = 3
const LOCK_MINUTES = 15

const CREDENCIAL_COLUMNS =
  'id, paciente_id, cpf, senha_hash, status, entidade_contratante_id, tentativas_login_falhas, bloqueado_ate, ultimo_login_em'

export class VdAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_CREDENTIALS'
      | 'USER_INACTIVE'
      | 'ACCOUNT_LOCKED'
      | 'INVALID_REFRESH'
      | 'NOT_FOUND'
      | 'TENANT_HOST_MISMATCH',
    readonly statusCode = 401,
  ) {
    super(message)
    this.name = 'VdAuthError'
  }
}

type PacienteCredencialRow = {
  id: string
  paciente_id: string
  cpf: string
  senha_hash: string
  status: 'ativo' | 'inativo'
  entidade_contratante_id: string
  tentativas_login_falhas: number
  bloqueado_ate: Date | null
  ultimo_login_em: Date | null
}

function parseCredencialRow(row: Record<string, unknown>): PacienteCredencialRow {
  return {
    id: String(row.id),
    paciente_id: String(row.paciente_id),
    cpf: String(row.cpf),
    senha_hash: String(row.senha_hash),
    status: row.status as PacienteCredencialRow['status'],
    entidade_contratante_id: String(row.entidade_contratante_id),
    tentativas_login_falhas: Number(row.tentativas_login_falhas ?? 0),
    bloqueado_ate: row.bloqueado_ate ? new Date(String(row.bloqueado_ate)) : null,
    ultimo_login_em: row.ultimo_login_em ? new Date(String(row.ultimo_login_em)) : null,
  }
}

async function findCredencialByCpf(
  cpf: string,
  entidadeContratanteId?: string,
): Promise<PacienteCredencialRow | null> {
  let query = supabaseAdmin
    .from('paciente_credenciais')
    .select(CREDENCIAL_COLUMNS)
    .eq('cpf', cpf)

  if (entidadeContratanteId) {
    query = query.eq('entidade_contratante_id', entidadeContratanteId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) return null

  return parseCredencialRow(data as Record<string, unknown>)
}

async function findCredencialById(id: string): Promise<PacienteCredencialRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_credenciais')
    .select(CREDENCIAL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return parseCredencialRow(data as Record<string, unknown>)
}

async function assertPacienteAtivo(pacienteId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('status')
    .eq('id', pacienteId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status !== 'ativo') {
    throw new VdAuthError('Conta inativa. Contate a prefeitura.', 'USER_INACTIVE', 403)
  }
}

function isLocked(credencial: PacienteCredencialRow): boolean {
  return Boolean(credencial.bloqueado_ate && credencial.bloqueado_ate.getTime() > Date.now())
}

async function registerFailedLogin(credencialId: string, attempts: number): Promise<void> {
  const nextAttempts = attempts + 1
  const lockAccount = nextAttempts >= MAX_FAILED_ATTEMPTS

  const patch: Record<string, unknown> = {
    tentativas_login_falhas: nextAttempts,
    atualizado_em: new Date().toISOString(),
  }

  if (lockAccount) {
    patch.bloqueado_ate = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
  }

  const { error } = await supabaseAdmin
    .from('paciente_credenciais')
    .update(patch)
    .eq('id', credencialId)

  if (error) throw error
}

async function clearFailedLogins(credencialId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('paciente_credenciais')
    .update({
      tentativas_login_falhas: 0,
      bloqueado_ate: null,
      ultimo_login_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', credencialId)

  if (error) throw error
}

async function loadVdUserPublic(credencial: PacienteCredencialRow): Promise<VdPacienteUserPublic> {
  const detail = await getPacienteDetail(credencial.paciente_id)
  return mapPatientDetailToVdUserPublic(detail, credencial.id)
}

async function issueAuthTokens(input: {
  credencial: PacienteCredencialRow
  nome: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: VdPacienteUserPublic }> {
  const accessToken = await signVdPacienteAccessToken({
    sub: input.credencial.id,
    pacienteId: input.credencial.paciente_id,
    cpf: input.credencial.cpf,
    nome: input.nome,
    entidadeContratanteId: input.credencial.entidade_contratante_id,
  })

  const refreshToken = createOpaqueToken()
  const tokenHash = hashOpaqueToken(refreshToken)

  const { error: sessionError } = await supabaseAdmin.from('sessoes_refresh_paciente').insert({
    credencial_id: input.credencial.id,
    hash_token: tokenHash,
    expira_em: vdRefreshExpiresAt(),
    agente_usuario: input.userAgent ?? null,
    endereco_ip: input.ipAddress ?? null,
  })

  if (sessionError) throw sessionError

  const user = await loadVdUserPublic(input.credencial)

  return { accessToken, refreshToken, user }
}

export async function loginVdPaciente(input: {
  cpf: string
  password: string
  tenantHost?: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: VdPacienteUserPublic }> {
  let cpf: string
  try {
    cpf = normalizeCpf(input.cpf)
  } catch {
    throw new VdAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  const vdTenant = await resolveVdTenantFromHost(input.tenantHost)
  const credencial = await findCredencialByCpf(cpf, vdTenant?.entidadeId)

  if (!credencial) {
    throw new VdAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  if (credencial.status !== 'ativo') {
    throw new VdAuthError('Conta inativa. Contate a prefeitura.', 'USER_INACTIVE', 403)
  }

  if (isLocked(credencial)) {
    throw new VdAuthError(
      'Conta temporariamente bloqueada por tentativas inválidas. Tente novamente em alguns minutos.',
      'ACCOUNT_LOCKED',
      423,
    )
  }

  const passwordOk = await verifyPassword(input.password, credencial.senha_hash)
  if (!passwordOk) {
    await registerFailedLogin(credencial.id, credencial.tentativas_login_falhas)
    throw new VdAuthError('CPF ou senha incorretos.', 'INVALID_CREDENTIALS')
  }

  if (vdTenant && vdTenant.entidadeId !== credencial.entidade_contratante_id) {
    throw new VdAuthError('Use o app da sua cidade.', 'TENANT_HOST_MISMATCH', 403)
  }

  await assertPacienteAtivo(credencial.paciente_id)
  await clearFailedLogins(credencial.id)

  const detail = await getPacienteDetail(credencial.paciente_id)

  return issueAuthTokens({
    credencial,
    nome: detail.name,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  })
}

export async function refreshVdPacienteSession(input: {
  refreshToken: string
  tenantHost?: string
  userAgent?: string
  ipAddress?: string
}): Promise<{ accessToken: string; refreshToken: string; user: VdPacienteUserPublic }> {
  const tokenHash = hashOpaqueToken(input.refreshToken)

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_paciente')
    .select('id, credencial_id, expira_em')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  if (!session || new Date(String(session.expira_em)).getTime() <= Date.now()) {
    throw new VdAuthError('Sessão expirada. Faça login novamente.', 'INVALID_REFRESH')
  }

  const credencial = await findCredencialById(String(session.credencial_id))
  if (!credencial || credencial.status !== 'ativo') {
    throw new VdAuthError('Conta inativa.', 'USER_INACTIVE', 403)
  }

  try {
    await assertVdSessionMatchesHost(credencial.entidade_contratante_id, input.tenantHost)
  } catch (error) {
    if (error instanceof TenantHostMismatchError) {
      throw new VdAuthError(error.message, 'TENANT_HOST_MISMATCH', 403)
    }
    throw error
  }

  await assertPacienteAtivo(credencial.paciente_id)

  const newRefreshToken = createOpaqueToken()
  const newTokenHash = hashOpaqueToken(newRefreshToken)

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sessoes_refresh_paciente')
    .insert({
      credencial_id: credencial.id,
      hash_token: newTokenHash,
      expira_em: vdRefreshExpiresAt(),
      agente_usuario: input.userAgent ?? null,
      endereco_ip: input.ipAddress ?? null,
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  const { error: revokeError } = await supabaseAdmin
    .from('sessoes_refresh_paciente')
    .update({
      revogado_em: new Date().toISOString(),
      substituido_por_id: inserted.id,
    })
    .eq('id', session.id)

  if (revokeError) throw revokeError

  const detail = await getPacienteDetail(credencial.paciente_id)
  const accessToken = await signVdPacienteAccessToken({
    sub: credencial.id,
    pacienteId: credencial.paciente_id,
    cpf: credencial.cpf,
    nome: detail.name,
    entidadeContratanteId: credencial.entidade_contratante_id,
  })

  const user = await loadVdUserPublic(credencial)

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user,
  }
}

export async function logoutVdPaciente(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return

  const tokenHash = hashOpaqueToken(refreshToken)
  const { data: sessionRow, error: sessionError } = await supabaseAdmin
    .from('sessoes_refresh_paciente')
    .select('credencial_id')
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)
    .maybeSingle()

  if (sessionError) throw sessionError

  const { error } = await supabaseAdmin
    .from('sessoes_refresh_paciente')
    .update({ revogado_em: new Date().toISOString() })
    .eq('hash_token', tokenHash)
    .is('revogado_em', null)

  if (error) throw error

  if (sessionRow?.credencial_id) {
    invalidateAuthSessionCache('vd', String(sessionRow.credencial_id))
  }
}

export async function getVdPacienteUserByCredencialId(
  credencialId: string,
): Promise<VdPacienteUserPublic> {
  const credencial = await findCredencialById(credencialId)
  if (!credencial || credencial.status !== 'ativo') {
    throw new VdAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }

  await assertPacienteAtivo(credencial.paciente_id)
  return loadVdUserPublic(credencial)
}
