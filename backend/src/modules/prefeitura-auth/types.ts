import type { EntidadeBrandingPublic } from '../../lib/entidadeBranding/types.js'
import {
  resolvePrefeituraPagePermissions,
  type PermissionAction,
  type PrefeituraPageId,
} from '../../lib/prefeituraPermissions.js'

export type PrefeituraPagePermissions = Record<PrefeituraPageId, PermissionAction[]>

export type UsuarioPrefeituraRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  senha_hash: string
  nivel_acesso: string
  status: 'ativo' | 'inativo'
  entidade_contratante_id: string
  entidade_razao_social: string
  municipio: string
  uf: string
  tentativas_login_falhas: number
  bloqueado_ate: Date | null
  ultimo_login_em: Date | null
}

export type PrefeituraUserBase = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  entidadeContratanteId: string
  entidadeRazaoSocial: string
  municipio: string
  uf: string
  lastLoginAt: string | null
  pagePermissions: PrefeituraPagePermissions
}

export type PrefeituraUserPublic = PrefeituraUserBase & EntidadeBrandingPublic

export function toPrefeituraUserPublic(
  row: UsuarioPrefeituraRow,
  permissoesPaginas?: unknown,
): PrefeituraUserBase {
  return {
    id: row.id,
    cpf: row.cpf,
    nome: row.nome,
    email: row.email,
    funcao: row.funcao,
    accessLevel: row.nivel_acesso,
    status: row.status,
    entidadeContratanteId: row.entidade_contratante_id,
    entidadeRazaoSocial: row.entidade_razao_social,
    municipio: row.municipio,
    uf: row.uf,
    lastLoginAt: row.ultimo_login_em?.toISOString() ?? null,
    pagePermissions: resolvePrefeituraPagePermissions(row.nivel_acesso, permissoesPaginas),
  }
}
