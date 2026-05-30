export type UsuarioAdminRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  senha_hash: string
  nivel_acesso: string
  departamento: string
  eh_master: boolean
  status: 'ativo' | 'inativo'
  tentativas_login_falhas: number
  bloqueado_ate: Date | null
  ultimo_login_em: Date | null
}

import {
  fullAdminPagePermissions,
  sanitizeAdminPagePermissions,
  type AdminPageId,
  type PermissionAction,
} from '../../lib/adminPermissions.js'

export type AdminPagePermissions = Record<AdminPageId, PermissionAction[]>

export type AdminUserPublic = {
  id: string
  cpf: string
  nome: string
  email: string | null
  accessLevel: string
  departmentId: string
  isMaster: boolean
  status: 'ativo' | 'inativo'
  lastLoginAt: string | null
  pagePermissions: AdminPagePermissions
}

export function toAdminUserPublic(
  row: UsuarioAdminRow,
  permissoesPaginas?: unknown,
): AdminUserPublic {
  return {
    id: row.id,
    cpf: row.cpf,
    nome: row.nome,
    email: row.email,
    accessLevel: row.nivel_acesso,
    departmentId: row.departamento,
    isMaster: row.eh_master,
    status: row.status,
    lastLoginAt: row.ultimo_login_em?.toISOString() ?? null,
    pagePermissions: row.eh_master
      ? fullAdminPagePermissions()
      : sanitizeAdminPagePermissions(permissoesPaginas),
  }
}
