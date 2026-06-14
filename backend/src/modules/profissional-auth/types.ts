import {
  resolveProfissionalPagePermissions,
  type PermissionAction,
  type ProfissionalPageId,
} from '../../lib/profissionalPermissions.js'

export type ProfissionalPagePermissions = Record<ProfissionalPageId, PermissionAction[]>

export type ProfissionalSexo = 'masculino' | 'feminino' | 'nao_informado'

export type UsuarioProfissionalRow = {
  id: string
  cpf: string
  nome: string
  email: string | null
  especialidade: string
  sexo: ProfissionalSexo
  senha_hash: string
  status: 'ativo' | 'inativo'
  tentativas_login_falhas: number
  bloqueado_ate: Date | null
  ultimo_login_em: Date | null
}

export type ProfissionalUserPublic = {
  id: string
  cpf: string
  nome: string
  email: string | null
  specialty: string
  sexo: ProfissionalSexo
  status: 'ativo' | 'inativo'
  lastLoginAt: string | null
  pagePermissions: ProfissionalPagePermissions
}

export function toProfissionalUserPublic(
  row: UsuarioProfissionalRow,
  permissoesPaginas?: unknown,
): ProfissionalUserPublic {
  return {
    id: row.id,
    cpf: row.cpf,
    nome: row.nome,
    email: row.email,
    specialty: row.especialidade,
    sexo: row.sexo,
    status: row.status,
    lastLoginAt: row.ultimo_login_em?.toISOString() ?? null,
    pagePermissions: resolveProfissionalPagePermissions(permissoesPaginas),
  }
}
