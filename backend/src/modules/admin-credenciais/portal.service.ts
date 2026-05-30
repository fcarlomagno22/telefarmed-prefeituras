import { createHash } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { hashPassword, verifyPassword } from '../../lib/password.js'
import { CredenciaisError } from './errors.js'
import { applyLoginUnlockPatch } from './login-lock.js'
import {
  avatarClassForId,
  formatLastAccessLabel,
  initialsFromName,
} from './formatters.js'
import { hasAnyPagePermission, sanitizeSystemPagePermissions } from './permissions.js'
import type { AdminPortalUserDto } from './types.js'

const RESPONSIBLE_ROLE = 'Responsável pela UBT'

function cpfPlaceholderFromEmail(email: string): string {
  const digest = createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
  const digits = digest.replace(/\D/g, '')
  return digits.slice(0, 11).padEnd(11, '0')
}

type PortalListRow = {
  id: string
  nome: string
  email: string | null
  funcao: string
  nivel_acesso: string
  escopo_portal: 'prefeitura' | 'ubt'
  status: 'ativo' | 'inativo'
  entidade_contratante_id: string
  unidade_ubt_id: string | null
  eh_responsavel_ubt: boolean
  permissoes_sistema: unknown
  entidade_razao_social: string
  municipio: string
  uf: string
  unidade_ubt_nome: string | null
  ra_chave: string | null
  ra_rotulo: string | null
  possui_senha: boolean
  possui_pin_autorizacao: boolean
  ultimo_login_em: string | null
}

function scopeToDb(scope: 'Prefeitura' | 'UBT'): 'prefeitura' | 'ubt' {
  return scope === 'Prefeitura' ? 'prefeitura' : 'ubt'
}

function scopeFromDb(scope: 'prefeitura' | 'ubt'): 'Prefeitura' | 'UBT' {
  return scope === 'prefeitura' ? 'Prefeitura' : 'UBT'
}

function mapPortalRow(row: PortalListRow): AdminPortalUserDto {
  return {
    id: row.id,
    name: row.nome,
    email: row.email ?? '',
    role: row.funcao,
    accessLevel: row.nivel_acesso,
    status: row.status,
    initials: initialsFromName(row.nome),
    avatarClassName: avatarClassForId(row.id),
    hasPassword: row.possui_senha,
    hasAuthorizationPin: row.possui_pin_autorizacao,
    pagePermissions: sanitizeSystemPagePermissions(row.permissoes_sistema),
    ubtId: row.unidade_ubt_id ?? undefined,
    ubtName: row.unidade_ubt_nome ?? undefined,
    raKey: row.ra_chave ?? undefined,
    raLabel: row.ra_rotulo ?? undefined,
    isUbtResponsible: row.eh_responsavel_ubt,
    scope: scopeFromDb(row.escopo_portal),
    unitName: row.unidade_ubt_nome ?? row.municipio,
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

async function assertUbtBelongsToEntity(ubtId: string, entityId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('id', ubtId)
    .eq('entidade_contratante_id', entityId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new CredenciaisError('UBT inválida para a entidade selecionada.', 'UBT_INVALID', 400)
  }
}

async function demoteOtherResponsibles(ubtId: string, keepUserId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('usuarios_portal')
    .update({
      eh_responsavel_ubt: false,
      funcao: 'Gestor da UBT',
    })
    .eq('unidade_ubt_id', ubtId)
    .eq('eh_responsavel_ubt', true)
    .neq('id', keepUserId)

  if (error) throw error
}

export async function listPortalCredentials(filters: {
  scope: 'Prefeitura' | 'UBT'
  search?: string
  profile?: string
  ubtId?: string
  contractingEntityId?: string
  status?: 'ativo' | 'inativo'
}): Promise<AdminPortalUserDto[]> {
  let query = supabaseAdmin
    .from('vw_credenciais_portal_listagem')
    .select(
      'id, nome, email, funcao, nivel_acesso, escopo_portal, status, entidade_contratante_id, unidade_ubt_id, eh_responsavel_ubt, permissoes_sistema, entidade_razao_social, municipio, uf, unidade_ubt_nome, ra_chave, ra_rotulo, possui_senha, possui_pin_autorizacao, ultimo_login_em',
    )
    .eq('escopo_portal', scopeToDb(filters.scope))
    .order('nome', { ascending: true })

  if (filters.ubtId) query = query.eq('unidade_ubt_id', filters.ubtId)
  if (filters.contractingEntityId) {
    query = query.eq('entidade_contratante_id', filters.contractingEntityId)
  }
  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as PortalListRow[]

  if (filters.profile?.trim()) {
    const profile = filters.profile.trim().toLowerCase()
    rows = rows.filter((row) => row.funcao.toLowerCase().includes(profile))
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase()
    rows = rows.filter((row) => {
      const haystack = [
        row.nome,
        row.email,
        row.funcao,
        row.unidade_ubt_nome,
        row.entidade_razao_social,
        row.municipio,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }

  return rows.map(mapPortalRow)
}

export async function getPortalCredentialById(id: string): Promise<AdminPortalUserDto> {
  const { data, error } = await supabaseAdmin
    .from('vw_credenciais_portal_listagem')
    .select(
      'id, nome, email, funcao, nivel_acesso, escopo_portal, status, entidade_contratante_id, unidade_ubt_id, eh_responsavel_ubt, permissoes_sistema, entidade_razao_social, municipio, uf, unidade_ubt_nome, ra_chave, ra_rotulo, possui_senha, possui_pin_autorizacao, ultimo_login_em',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new CredenciaisError('Usuário de portal não encontrado.', 'NOT_FOUND', 404)
  }

  return mapPortalRow(data as PortalListRow)
}

export async function createPortalCredential(input: {
  scope: 'Prefeitura' | 'UBT'
  name: string
  email: string
  cpf?: string
  role: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  contractingEntityId: string
  ubtId?: string
  isUbtResponsible?: boolean
  pagePermissions?: unknown
  password: string
  authorizationPin?: string
}): Promise<AdminPortalUserDto> {
  const escopo = scopeToDb(input.scope)
  const ubtId = input.ubtId ?? null

  if (escopo === 'ubt' && !ubtId) {
    throw new CredenciaisError('Selecione uma UBT para operadores de unidade.', 'UBT_REQUIRED')
  }

  if (ubtId) {
    await assertUbtBelongsToEntity(ubtId, input.contractingEntityId)
  }

  const permissions = sanitizeSystemPagePermissions(input.pagePermissions)
  if (!hasAnyPagePermission(permissions)) {
    throw new CredenciaisError('Defina permissões para ao menos uma página.', 'INVALID_DATA')
  }

  const cpf = normalizeCpf(input.cpf ?? cpfPlaceholderFromEmail(input.email))
  const isResponsible = Boolean(input.isUbtResponsible) || input.role.trim() === RESPONSIBLE_ROLE
  const funcao = isResponsible ? RESPONSIBLE_ROLE : input.role

  const senhaHash = await hashPassword(input.password)
  const pinHash = input.authorizationPin ? await hashPassword(input.authorizationPin) : null

  const { data, error } = await supabaseAdmin
    .from('usuarios_portal')
    .insert({
      cpf,
      nome: input.name,
      email: input.email,
      funcao,
      senha_hash: senhaHash,
      pin_autorizacao_hash: pinHash,
      nivel_acesso: input.accessLevel,
      escopo_portal: escopo,
      status: input.status,
      entidade_contratante_id: input.contractingEntityId,
      unidade_ubt_id: ubtId,
      eh_responsavel_ubt: isResponsible,
      permissoes_sistema: permissions,
      entidade_razao_social: 'pendente',
      municipio: 'pendente',
      uf: 'SP',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('responsavel')) {
        throw new CredenciaisError(
          'Já existe um responsável ativo nesta UBT.',
          'INVALID_DATA',
          409,
        )
      }
      throw new CredenciaisError('CPF ou e-mail já cadastrado neste portal.', 'DUPLICATE_CPF', 409)
    }
    throw error
  }

  const id = String(data.id)
  if (isResponsible && ubtId) {
    await demoteOtherResponsibles(ubtId, id)
  }

  return getPortalCredentialById(id)
}

export async function updatePortalCredential(
  id: string,
  input: {
    name?: string
    email?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    contractingEntityId?: string
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminPortalUserDto> {
  const existing = await getPortalCredentialById(id)
  const entityId = input.contractingEntityId ?? existing.contractingEntity.id
  const ubtId = input.ubtId ?? existing.ubtId ?? null

  if (existing.scope === 'UBT' && !ubtId) {
    throw new CredenciaisError('Selecione uma UBT válida.', 'UBT_REQUIRED')
  }

  if (ubtId) {
    await assertUbtBelongsToEntity(ubtId, entityId)
  }

  const patch: Record<string, unknown> = {
    atualizado_em: new Date().toISOString(),
  }

  if (input.name !== undefined) patch.nome = input.name
  if (input.email !== undefined) patch.email = input.email
  if (input.accessLevel !== undefined) patch.nivel_acesso = input.accessLevel
  if (input.status !== undefined) {
    patch.status = input.status
    if (input.status === 'ativo') {
      applyLoginUnlockPatch(patch)
    }
  }
  if (input.contractingEntityId !== undefined) {
    patch.entidade_contratante_id = input.contractingEntityId
  }
  if (input.ubtId !== undefined) patch.unidade_ubt_id = input.ubtId

  let isResponsible = existing.isUbtResponsible ?? false
  if (input.isUbtResponsible !== undefined) {
    isResponsible = input.isUbtResponsible
  }
  if (input.role !== undefined) {
    const roleIsResponsible = input.role.trim() === RESPONSIBLE_ROLE
    patch.funcao = roleIsResponsible ? RESPONSIBLE_ROLE : input.role
    if (roleIsResponsible) isResponsible = true
  } else if (isResponsible) {
    patch.funcao = RESPONSIBLE_ROLE
  }

  patch.eh_responsavel_ubt = isResponsible

  if (input.pagePermissions !== undefined) {
    const permissions = sanitizeSystemPagePermissions(input.pagePermissions)
    if (!hasAnyPagePermission(permissions)) {
      throw new CredenciaisError('Defina permissões para ao menos uma página.', 'INVALID_DATA')
    }
    patch.permissoes_sistema = permissions
  }

  if (input.password) {
    patch.senha_hash = await hashPassword(input.password)
    patch.senha_alterada_em = new Date().toISOString()
  }

  if (input.authorizationPin !== undefined) {
    patch.pin_autorizacao_hash =
      input.authorizationPin === null ? null : await hashPassword(input.authorizationPin)
  }

  const { error } = await supabaseAdmin.from('usuarios_portal').update(patch).eq('id', id)
  if (error) {
    if (error.code === '23505') {
      throw new CredenciaisError('Já existe um responsável ativo nesta UBT.', 'INVALID_DATA', 409)
    }
    throw error
  }

  if (isResponsible && ubtId) {
    await demoteOtherResponsibles(ubtId, id)
  }

  return getPortalCredentialById(id)
}

export async function deactivatePortalCredential(id: string): Promise<AdminPortalUserDto> {
  return updatePortalCredential(id, { status: 'inativo', isUbtResponsible: false })
}

export async function activatePortalCredential(id: string): Promise<AdminPortalUserDto> {
  return updatePortalCredential(id, { status: 'ativo' })
}

export async function deletePortalCredential(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('usuarios_portal').delete().eq('id', id)
  if (error) throw error
}

export async function transferPortalCredentialUbt(
  id: string,
  targetUbtId: string,
): Promise<AdminPortalUserDto> {
  const existing = await getPortalCredentialById(id)
  await assertUbtBelongsToEntity(targetUbtId, existing.contractingEntity.id)

  const wasResponsible = existing.isUbtResponsible ?? false
  const { error } = await supabaseAdmin
    .from('usuarios_portal')
    .update({
      unidade_ubt_id: targetUbtId,
      eh_responsavel_ubt: wasResponsible,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error

  if (wasResponsible) {
    await demoteOtherResponsibles(targetUbtId, id)
  }

  return getPortalCredentialById(id)
}

async function findResponsibleForUbt(ubtId: string): Promise<{ id: string; pinHash: string | null } | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_portal')
    .select('id, pin_autorizacao_hash')
    .eq('unidade_ubt_id', ubtId)
    .eq('eh_responsavel_ubt', true)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    id: String(data.id),
    pinHash: data.pin_autorizacao_hash ? String(data.pin_autorizacao_hash) : null,
  }
}

export async function verifyPortalResponsiblePin(input: {
  userId: string
  pin: string
}): Promise<{ ok: true }> {
  const user = await getPortalCredentialById(input.userId)
  const ubtId = user.ubtId

  if (!ubtId) {
    throw new CredenciaisError(
      'Usuário sem UBT vinculada — não é possível validar o PIN do responsável.',
      'PIN_NOT_CONFIGURED',
      400,
    )
  }

  const responsible = await findResponsibleForUbt(ubtId)
  if (!responsible?.pinHash) {
    throw new CredenciaisError(
      'Nenhum responsável com PIN configurado nesta unidade.',
      'PIN_NOT_CONFIGURED',
      400,
    )
  }

  const valid = await verifyPassword(input.pin, responsible.pinHash)
  if (!valid) {
    throw new CredenciaisError('Senha de autorização incorreta.', 'PIN_INVALID', 401)
  }

  return { ok: true }
}
