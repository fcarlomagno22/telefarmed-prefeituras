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
import { hasAnyPagePermission, sanitizeAdminPagePermissions } from './permissions.js'
import type { AdminInternoCredentialDto } from './types.js'

type InternoListRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  departamento: string
  nivel_acesso: string
  status: 'ativo' | 'inativo'
  eh_master: boolean
  permissoes_paginas: unknown
  possui_senha: boolean
  possui_pin_autorizacao: boolean
  ultimo_login_em: string | null
}

function mapInternoRow(row: InternoListRow): AdminInternoCredentialDto {
  return {
    id: row.id,
    name: row.nome,
    email: row.email ?? '',
    cpf: formatCpfDisplay(row.cpf),
    role: row.funcao,
    departmentId: row.departamento,
    accessLevel: row.nivel_acesso,
    status: row.status,
    initials: initialsFromName(row.nome),
    avatarClassName: avatarClassForId(row.id),
    hasPassword: row.possui_senha,
    hasAuthorizationPin: row.possui_pin_autorizacao,
    lastAccessLabel: formatLastAccessLabel(row.ultimo_login_em),
    pagePermissions: sanitizeAdminPagePermissions(row.permissoes_paginas),
    isMaster: row.eh_master,
  }
}

export async function listInternoCredentials(filters: {
  search?: string
  departmentId?: string
  status?: 'ativo' | 'inativo'
  accessLevel?: string
}): Promise<AdminInternoCredentialDto[]> {
  let query = supabaseAdmin
    .from('vw_credenciais_admin_listagem')
    .select(
      'id, cpf, nome, email, funcao, departamento, nivel_acesso, status, eh_master, permissoes_paginas, possui_senha, possui_pin_autorizacao, ultimo_login_em',
    )
    .order('nome', { ascending: true })

  if (filters.departmentId) {
    query = query.eq('departamento', filters.departmentId)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.accessLevel) {
    query = query.eq('nivel_acesso', filters.accessLevel)
  }

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as InternoListRow[]

  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase()
    rows = rows.filter((row) => {
      const haystack = [row.nome, row.email, row.funcao, row.cpf, row.departamento]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }

  return rows.map(mapInternoRow)
}

export async function getInternoCredentialById(id: string): Promise<AdminInternoCredentialDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_credenciais_admin_listagem')
    .select(
      'id, cpf, nome, email, funcao, departamento, nivel_acesso, status, eh_master, permissoes_paginas, possui_senha, possui_pin_autorizacao, ultimo_login_em',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new CredenciaisError('Usuário interno não encontrado.', 'NOT_FOUND', 404)
  }

  return mapInternoRow(data as InternoListRow)
}

export async function createInternoCredential(input: {
  name: string
  email: string
  cpf: string
  role: string
  departmentId: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  pagePermissions?: unknown
  password: string
  authorizationPin?: string
}): Promise<AdminInternoCredentialDto> {
  const cpf = normalizeCpf(input.cpf)
  const permissions = sanitizeAdminPagePermissions(input.pagePermissions)

  if (!hasAnyPagePermission(permissions)) {
    throw new CredenciaisError('Defina permissões para ao menos uma página.', 'INVALID_DATA')
  }

  const senhaHash = await hashPassword(input.password)
  const pinHash = input.authorizationPin ? await hashPassword(input.authorizationPin) : null

  const { data, error } = await supabaseAdmin
    .from('usuarios_admin')
    .insert({
      cpf,
      nome: input.name,
      email: input.email,
      funcao: input.role,
      departamento: input.departmentId,
      nivel_acesso: input.accessLevel,
      status: input.status,
      senha_hash: senhaHash,
      pin_autorizacao_hash: pinHash,
      permissoes_paginas: permissions,
      eh_master: false,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new CredenciaisError('CPF ou e-mail já cadastrado.', 'DUPLICATE_CPF', 409)
    }
    throw error
  }

  return getInternoCredentialById(String(data.id))
}

export async function updateInternoCredential(
  id: string,
  input: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    departmentId?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminInternoCredentialDto> {
  const existing = await getInternoCredentialById(id)

  const patch: Record<string, unknown> = {
    atualizado_em: new Date().toISOString(),
  }

  if (input.name !== undefined) patch.nome = input.name
  if (input.email !== undefined) patch.email = input.email
  if (input.cpf !== undefined) patch.cpf = normalizeCpf(input.cpf)
  if (input.role !== undefined) patch.funcao = input.role
  if (input.departmentId !== undefined) patch.departamento = input.departmentId
  if (input.accessLevel !== undefined) patch.nivel_acesso = input.accessLevel
  if (input.status !== undefined) patch.status = input.status

  if (input.pagePermissions !== undefined) {
    const permissions = sanitizeAdminPagePermissions(input.pagePermissions)
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

  if (existing.isMaster && input.status === 'inativo') {
    throw new CredenciaisError('O usuário master não pode ser desativado.', 'MASTER_PROTECTED', 403)
  }

  const { error } = await supabaseAdmin.from('usuarios_admin').update(patch).eq('id', id)
  if (error) {
    if (error.code === '23505') {
      throw new CredenciaisError('CPF ou e-mail já cadastrado.', 'DUPLICATE_CPF', 409)
    }
    throw error
  }

  return getInternoCredentialById(id)
}

export async function deactivateInternoCredential(id: string): Promise<AdminInternoCredentialDto> {
  return updateInternoCredential(id, { status: 'inativo' })
}

export async function activateInternoCredential(id: string): Promise<AdminInternoCredentialDto> {
  return updateInternoCredential(id, { status: 'ativo' })
}

export async function deleteInternoCredential(id: string): Promise<void> {
  const existing = await getInternoCredentialById(id)
  if (existing.isMaster) {
    throw new CredenciaisError('O usuário master não pode ser excluído.', 'MASTER_PROTECTED', 403)
  }

  const { error } = await supabaseAdmin.from('usuarios_admin').delete().eq('id', id)
  if (error) {
    if (error.message.includes('master')) {
      throw new CredenciaisError('O usuário master não pode ser excluído.', 'MASTER_PROTECTED', 403)
    }
    throw error
  }
}
