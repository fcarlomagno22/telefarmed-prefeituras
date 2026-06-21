import { invalidateAuthSessionCache } from '../../lib/cache/authSessionCache.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { hashPassword } from '../../lib/password.js'
import { CredenciaisError } from './errors.js'
import {
  avatarClassForId,
  formatCpfDisplay,
  formatLastAccessLabel,
  initialsFromName,
} from './formatters.js'
import { applyLoginUnlockPatch } from './login-lock.js'
import { hasAnyPagePermission, sanitizePrefeituraPagePermissions } from './permissions.js'
import type { AdminPortalUserDto } from './types.js'

type PrefeituraListRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  nivel_acesso: string
  status: 'ativo' | 'inativo'
  entidade_contratante_id: string
  permissoes_paginas: unknown
  entidade_razao_social: string
  municipio: string
  uf: string
  possui_senha: boolean
  possui_pin_autorizacao: boolean
  ultimo_login_em: string | null
}

const LIST_COLUMNS =
  'id, cpf, nome, email, funcao, nivel_acesso, status, entidade_contratante_id, permissoes_paginas, entidade_razao_social, municipio, uf, possui_senha, possui_pin_autorizacao, ultimo_login_em'

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

function normalizePrefeituraCpf(value: string): string {
  try {
    return normalizeCpf(value)
  } catch {
    throw new CredenciaisError('Informe um CPF válido com 11 dígitos.', 'INVALID_DATA')
  }
}

async function assertContractingEntityExists(entityId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('id')
    .eq('id', entityId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new CredenciaisError('Entidade contratante não encontrada.', 'INVALID_DATA', 404)
  }
}

function mapPrefeituraRow(row: PrefeituraListRow): AdminPortalUserDto {
  return {
    id: row.id,
    name: row.nome,
    email: row.email ?? '',
    cpf: formatCpfDisplay(row.cpf),
    role: row.funcao,
    accessLevel: row.nivel_acesso,
    status: row.status,
    initials: initialsFromName(row.nome),
    avatarClassName: avatarClassForId(row.id),
    hasPassword: row.possui_senha,
    hasAuthorizationPin: row.possui_pin_autorizacao,
    pagePermissions: sanitizePrefeituraPagePermissions(row.permissoes_paginas),
    scope: 'Prefeitura',
    unitName: row.municipio,
    contractingEntity: {
      id: row.entidade_contratante_id,
      razaoSocial: row.entidade_razao_social,
      municipality: row.municipio,
      uf: row.uf,
    },
    lastAccessLabel: formatLastAccessLabel(row.ultimo_login_em),
    profileLabel: row.funcao,
  }
}

export async function listPrefeituraCredentials(filters: {
  search?: string
  profile?: string
  contractingEntityId?: string
  status?: 'ativo' | 'inativo'
}): Promise<AdminPortalUserDto[]> {
  let query = supabaseAdmin
    .from('vw_credenciais_prefeitura_listagem')
    .select(LIST_COLUMNS)
    .order('nome', { ascending: true })

  if (filters.contractingEntityId) {
    query = query.eq('entidade_contratante_id', filters.contractingEntityId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.profile?.trim()) {
    query = query.ilike('funcao', `%${escapeIlike(filters.profile.trim())}%`)
  }
  if (filters.search?.trim()) {
    const term = escapeIlike(filters.search.trim())
    const pattern = `%${term}%`
    const cpfDigits = filters.search.replace(/\D/g, '')
    const orParts = [
      `nome.ilike.${pattern}`,
      `email.ilike.${pattern}`,
      `funcao.ilike.${pattern}`,
      `entidade_razao_social.ilike.${pattern}`,
      `municipio.ilike.${pattern}`,
    ]
    if (cpfDigits.length >= 3) {
      orParts.push(`cpf.ilike.%${cpfDigits}%`)
    }
    query = query.or(orParts.join(','))
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as PrefeituraListRow[]).map(mapPrefeituraRow)
}

export async function getPrefeituraCredentialById(id: string): Promise<AdminPortalUserDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_credenciais_prefeitura_listagem')
    .select(LIST_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new CredenciaisError('Usuário de portal não encontrado.', 'NOT_FOUND', 404)
  }

  return mapPrefeituraRow(data as PrefeituraListRow)
}

export async function createPrefeituraCredential(input: {
  name: string
  email: string
  cpf: string
  role: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  contractingEntityId: string
  pagePermissions?: unknown
  password: string
  authorizationPin?: string
}): Promise<AdminPortalUserDto> {
  await assertContractingEntityExists(input.contractingEntityId)

  const cpf = normalizePrefeituraCpf(input.cpf)
  const permissions = sanitizePrefeituraPagePermissions(input.pagePermissions)

  if (!hasAnyPagePermission(permissions)) {
    throw new CredenciaisError('Defina permissões para ao menos uma página.', 'INVALID_DATA')
  }

  const senhaHash = await hashPassword(input.password)
  const pinHash = input.authorizationPin ? await hashPassword(input.authorizationPin) : null

  const { data, error } = await supabaseAdmin
    .from('usuarios_prefeitura')
    .insert({
      cpf,
      nome: input.name,
      email: input.email,
      funcao: input.role,
      senha_hash: senhaHash,
      pin_autorizacao_hash: pinHash,
      nivel_acesso: input.accessLevel,
      status: input.status,
      entidade_contratante_id: input.contractingEntityId,
      permissoes_paginas: permissions,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new CredenciaisError('CPF ou e-mail já cadastrado.', 'DUPLICATE_CPF', 409)
    }
    throw error
  }

  return getPrefeituraCredentialById(String(data.id))
}

export async function updatePrefeituraCredential(
  id: string,
  input: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    contractingEntityId?: string
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminPortalUserDto> {
  await getPrefeituraCredentialById(id)

  const patch: Record<string, unknown> = {
    atualizado_em: new Date().toISOString(),
  }

  if (input.name !== undefined) patch.nome = input.name
  if (input.email !== undefined) patch.email = input.email
  if (input.cpf !== undefined) patch.cpf = normalizePrefeituraCpf(input.cpf)
  if (input.role !== undefined) patch.funcao = input.role
  if (input.accessLevel !== undefined) patch.nivel_acesso = input.accessLevel
  if (input.status !== undefined) {
    patch.status = input.status
    if (input.status === 'ativo') {
      applyLoginUnlockPatch(patch)
    }
  }
  if (input.contractingEntityId !== undefined) {
    await assertContractingEntityExists(input.contractingEntityId)
    patch.entidade_contratante_id = input.contractingEntityId
  }

  if (input.pagePermissions !== undefined) {
    const permissions = sanitizePrefeituraPagePermissions(input.pagePermissions)
    if (!hasAnyPagePermission(permissions)) {
      throw new CredenciaisError('Defina permissões para ao menos uma página.', 'INVALID_DATA')
    }
    patch.permissoes_paginas = permissions
  }

  if (input.password) {
    patch.senha_hash = await hashPassword(input.password)
    patch.senha_alterada_em = new Date().toISOString()
  }

  if (input.authorizationPin !== undefined) {
    patch.pin_autorizacao_hash =
      input.authorizationPin === null ? null : await hashPassword(input.authorizationPin)
  }

  const { error } = await supabaseAdmin.from('usuarios_prefeitura').update(patch).eq('id', id)
  if (error) {
    if (error.code === '23505') {
      throw new CredenciaisError('CPF ou e-mail já cadastrado.', 'DUPLICATE_CPF', 409)
    }
    throw error
  }

  invalidateAuthSessionCache('prefeitura', id)
  return getPrefeituraCredentialById(id)
}

export async function deactivatePrefeituraCredential(id: string): Promise<AdminPortalUserDto> {
  return updatePrefeituraCredential(id, { status: 'inativo' })
}

export async function activatePrefeituraCredential(id: string): Promise<AdminPortalUserDto> {
  return updatePrefeituraCredential(id, { status: 'ativo' })
}

export async function deletePrefeituraCredential(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('usuarios_prefeitura').delete().eq('id', id)
  if (error) throw error
  invalidateAuthSessionCache('prefeitura', id)
}
