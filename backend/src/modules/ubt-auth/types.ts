import type { EntidadeBrandingPublic } from '../../lib/entidadeBranding/types.js'
import {
  resolveUbtPagePermissions,
  type PermissionAction,
  type UbtPageId,
} from '../../lib/ubtPermissions.js'

export type UbtSystemPermissions = Record<UbtPageId, PermissionAction[]>

export type UsuarioUbtRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  senha_hash: string
  nivel_acesso: string
  status: 'ativo' | 'inativo'
  entidade_contratante_id: string
  unidade_ubt_id: string
  entidade_razao_social: string
  municipio: string
  uf: string
  unidade_ubt_nome: string
  tentativas_login_falhas: number
  bloqueado_ate: Date | null
  ultimo_login_em: Date | null
}

export type UbtUserBase = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  entidadeContratanteId: string
  unidadeUbtId: string
  unidadeUbtNome: string
  entidadeRazaoSocial: string
  municipio: string
  uf: string
  lastLoginAt: string | null
  systemPermissions: UbtSystemPermissions
}

export type UbtUserPublic = UbtUserBase & EntidadeBrandingPublic

export function toUbtUserPublic(
  row: UsuarioUbtRow,
  permissoesSistema?: unknown,
): UbtUserBase {
  return {
    id: row.id,
    cpf: row.cpf,
    nome: row.nome,
    email: row.email,
    funcao: row.funcao,
    accessLevel: row.nivel_acesso,
    status: row.status,
    entidadeContratanteId: row.entidade_contratante_id,
    unidadeUbtId: row.unidade_ubt_id,
    unidadeUbtNome: row.unidade_ubt_nome,
    entidadeRazaoSocial: row.entidade_razao_social,
    municipio: row.municipio,
    uf: row.uf,
    lastLoginAt: row.ultimo_login_em?.toISOString() ?? null,
    systemPermissions: resolveUbtPagePermissions(row.nivel_acesso, permissoesSistema),
  }
}
