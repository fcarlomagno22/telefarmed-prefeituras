import type { AdminPageId, PermissionAction, PrefeituraPageId, SystemPageId } from './permissions.js'

export type AdminInternoCredentialDto = {
  id: string
  name: string
  email: string
  cpf: string
  role: string
  departmentId: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  initials: string
  avatarClassName: string
  hasPassword: boolean
  hasAuthorizationPin: boolean
  lastAccessLabel: string
  pagePermissions: Record<AdminPageId, PermissionAction[]>
  isMaster?: boolean
}

export type AdminPortalUserDto = {
  id: string
  name: string
  email: string
  cpf?: string
  role: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  initials: string
  avatarClassName: string
  hasPassword: boolean
  hasAuthorizationPin?: boolean
  pagePermissions:
    | Record<SystemPageId, PermissionAction[]>
    | Record<PrefeituraPageId, PermissionAction[]>
  ubtId?: string
  ubtName?: string
  raKey?: string
  raLabel?: string
  isUbtResponsible?: boolean
  scope: 'Prefeitura' | 'UBT'
  unitName: string
  contractingEntity: {
    id: string
    razaoSocial: string
    municipality: string
    uf: string
  }
  lastAccessLabel: string
  profileLabel: string
}

export type CredenciaisKpisDto = {
  internosTotal: number
  prefeituraTotal: number
  ubtTotal: number
  ativosRedeTotal: number
}

export type ContractingEntityOptionDto = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
  label: string
}

export type UbtOptionDto = {
  value: string
  label: string
  ubtName: string
  slug: string
  raKey: string
  raLabel: string
  contractingEntityId: string
}
