import type { AccessLevelId, PermissionAction, SystemPageId } from '../config/accessCredentials'
import { buildPresetPagePermissions } from '../config/accessCredentials'
import { prefeituraRedeUnits } from './prefeituraRedeMock'

export type CredentialUserStatus = 'ativo' | 'inativo'

export type AccessCredentialUser = {
  id: string
  cpf?: string
  name: string
  email: string
  role: string
  accessLevel: AccessLevelId
  status: CredentialUserStatus
  initials: string
  avatarClassName: string
  avatarUrl?: string
  hasPassword: boolean
  /** PIN de 6 dígitos para autorizar ações sensíveis (opcional). */
  hasAuthorizationPin?: boolean
  pagePermissions: Record<SystemPageId, PermissionAction[]>
  /** Visão municipal — unidade vinculada ao acesso. */
  ubtId?: string
  ubtName?: string
  raKey?: string
  raLabel?: string
  isUbtResponsible?: boolean
}

import type { AdminOperatorRow } from './adminOperadoresMock'

export function mapOperatorRowToAccessCredentialUser(row: AdminOperatorRow): AccessCredentialUser {
  return {
    id: row.id,
    cpf: row.cpf,
    name: row.name,
    email: row.email,
    role: row.role,
    accessLevel: row.accessLevel as AccessCredentialUser['accessLevel'],
    status: row.status,
    initials: row.initials,
    avatarClassName: row.avatarClassName,
    hasPassword: row.hasPassword,
    hasAuthorizationPin: row.hasAuthorizationPin,
    pagePermissions: row.pagePermissions,
    ubtId: row.ubtId,
    ubtName: row.ubtName ?? row.unitName,
    raKey: row.raKey,
    raLabel: row.raLabel,
    isUbtResponsible: row.isUbtResponsible,
  }
}

export type RecentAccessEntry = {
  userId: string
  name: string
  initials: string
  avatarClassName: string
  avatarUrl?: string
  accessedAtLabel: string
}

const defaultCredentialsUbt = prefeituraRedeUnits.find((unit) => unit.status === 'ativa')

function withDefaultUbt(user: Omit<AccessCredentialUser, 'ubtId' | 'ubtName'>): AccessCredentialUser {
  return {
    ...user,
    ubtId: defaultCredentialsUbt?.id,
    ubtName: defaultCredentialsUbt?.name,
  }
}

export const initialAccessCredentialUsers: AccessCredentialUser[] = [
  withDefaultUbt({
    id: 'cred-1',
    name: 'Juliana Silva',
    email: 'juliana.silva@ubt.gov.br',
    role: 'Gestora da UBT',
    accessLevel: 'administrador',
    status: 'ativo',
    initials: 'JS',
    avatarClassName: 'bg-orange-100 text-orange-700',
    hasPassword: true,
    hasAuthorizationPin: true,
    pagePermissions: buildPresetPagePermissions('administrador'),
  }),
  withDefaultUbt({
    id: 'cred-2',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@ubt.gov.br',
    role: 'Médico',
    accessLevel: 'operador',
    status: 'ativo',
    initials: 'CM',
    avatarClassName: 'bg-sky-100 text-sky-700',
    hasPassword: true,
    pagePermissions: buildPresetPagePermissions('operador'),
  }),
  withDefaultUbt({
    id: 'cred-3',
    name: 'Fernanda Oliveira',
    email: 'fernanda.oliveira@ubt.gov.br',
    role: 'Enfermeira',
    accessLevel: 'operador',
    status: 'ativo',
    initials: 'FO',
    avatarClassName: 'bg-violet-100 text-violet-700',
    hasPassword: true,
    pagePermissions: buildPresetPagePermissions('operador'),
  }),
  withDefaultUbt({
    id: 'cred-4',
    name: 'Lucas Pereira',
    email: 'lucas.pereira@ubt.gov.br',
    role: 'Recepcionista',
    accessLevel: 'editor',
    status: 'ativo',
    initials: 'LP',
    avatarClassName: 'bg-purple-100 text-purple-700',
    hasPassword: true,
    pagePermissions: buildPresetPagePermissions('editor'),
  }),
  withDefaultUbt({
    id: 'cred-5',
    name: 'Mariana Costa',
    email: 'mariana.costa@ubt.gov.br',
    role: 'Assistente administrativo',
    accessLevel: 'visualizador',
    status: 'ativo',
    initials: 'MC',
    avatarClassName: 'bg-gray-100 text-gray-600',
    hasPassword: true,
    pagePermissions: buildPresetPagePermissions('visualizador'),
  }),
  withDefaultUbt({
    id: 'cred-6',
    name: 'Ricardo Alves',
    email: 'ricardo.alves@ubt.gov.br',
    role: 'Técnico de enfermagem',
    accessLevel: 'visualizador',
    status: 'inativo',
    initials: 'RA',
    avatarClassName: 'bg-rose-100 text-rose-700',
    hasPassword: true,
    pagePermissions: buildPresetPagePermissions('visualizador'),
  }),
]

export const recentAccessEntries: RecentAccessEntry[] = [
  {
    userId: 'cred-1',
    name: 'Juliana Silva',
    initials: 'JS',
    avatarClassName: 'bg-orange-100 text-orange-700',
    accessedAtLabel: 'Hoje, 22:30',
  },
  {
    userId: 'cred-2',
    name: 'Carlos Mendes',
    initials: 'CM',
    avatarClassName: 'bg-sky-100 text-sky-700',
    accessedAtLabel: 'Hoje, 19:15',
  },
  {
    userId: 'cred-3',
    name: 'Fernanda Oliveira',
    initials: 'FO',
    avatarClassName: 'bg-violet-100 text-violet-700',
    accessedAtLabel: 'Ontem, 18:20',
  },
  {
    userId: 'cred-4',
    name: 'Lucas Pereira',
    initials: 'LP',
    avatarClassName: 'bg-purple-100 text-purple-700',
    accessedAtLabel: 'Ontem, 14:05',
  },
  {
    userId: 'cred-5',
    name: 'Mariana Costa',
    initials: 'MC',
    avatarClassName: 'bg-gray-100 text-gray-600',
    accessedAtLabel: '12 mai, 09:40',
  },
]
