import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'
import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/credenciais'
import * as mock from '../../mockServices/admin/credenciais'

const useApi = isBackendApiEnabled()

export type CredenciaisKpis = api.CredenciaisKpis
export type PortalCredentialsListParams = api.PortalCredentialsListParams

export const AdminCredenciaisApiError = useApi ? api.AdminCredenciaisApiError : mock.AdminCredenciaisApiError

export const fetchCredenciaisKpis = useApi ? api.fetchCredenciaisKpis : mock.fetchCredenciaisKpis
export const fetchInternoCredentials = useApi ? api.fetchInternoCredentials : mock.fetchInternoCredentials
export const fetchInternoCredentialDetail = useApi
  ? api.fetchInternoCredentialDetail
  : mock.fetchInternoCredentialDetail
export const createInternoCredential = useApi ? api.createInternoCredential : mock.createInternoCredential
export const updateInternoCredential = useApi ? api.updateInternoCredential : mock.updateInternoCredential
export const deactivateInternoCredential = useApi
  ? api.deactivateInternoCredential
  : mock.deactivateInternoCredential
export const activateInternoCredential = useApi ? api.activateInternoCredential : mock.activateInternoCredential
export const deleteInternoCredential = useApi ? api.deleteInternoCredential : mock.deleteInternoCredential
export const fetchPortalCredentials = useApi ? api.fetchPortalCredentials : mock.fetchPortalCredentials
export const fetchPortalCredentialDetail = useApi
  ? api.fetchPortalCredentialDetail
  : mock.fetchPortalCredentialDetail
export const fetchPrefeituraCredentialDetail = useApi
  ? api.fetchPrefeituraCredentialDetail
  : mock.fetchPrefeituraCredentialDetail
export const createPortalCredential = useApi ? api.createPortalCredential : mock.createPortalCredential
export const updatePortalCredential = useApi ? api.updatePortalCredential : mock.updatePortalCredential
export const deactivatePortalCredential = useApi
  ? api.deactivatePortalCredential
  : mock.deactivatePortalCredential
export const activatePortalCredential = useApi ? api.activatePortalCredential : mock.activatePortalCredential
export const deletePortalCredential = useApi ? api.deletePortalCredential : mock.deletePortalCredential
export const transferPortalCredentialUbt = useApi
  ? api.transferPortalCredentialUbt
  : mock.transferPortalCredentialUbt
export const verifyPortalResponsiblePin = useApi
  ? api.verifyPortalResponsiblePin
  : mock.verifyPortalResponsiblePin
export const fetchContractingEntities = useApi ? api.fetchContractingEntities : mock.fetchContractingEntities
export const fetchUbtOptions = useApi ? api.fetchUbtOptions : mock.fetchUbtOptions
export const fetchUbtOptionsByEntity = useApi ? api.fetchUbtOptionsByEntity : mock.fetchUbtOptionsByEntity
export const isCredenciaisApiError = useApi ? api.isCredenciaisApiError : mock.isCredenciaisApiError

export const fetchPrefeituraCredentials = useApi
  ? api.fetchPrefeituraCredentials
  : mock.fetchPrefeituraCredentials

async function createPrefeituraCredentialApi(
  accessToken: string,
  body: Parameters<typeof mock.createPrefeituraCredential>[1],
): Promise<PrefeituraCredentialUser> {
  const created = await api.createPortalCredential(accessToken, {
    scope: 'Prefeitura',
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    role: body.role,
    accessLevel: body.accessLevel,
    status: body.status,
    contractingEntityId: body.contractingEntityId,
    pagePermissions: body.pagePermissions as Parameters<typeof api.createPortalCredential>[1]['pagePermissions'],
    password: body.password,
    authorizationPin: body.authorizationPin,
  })
  return {
    id: created.id,
    name: created.name,
    email: created.email,
    cpf: body.cpf,
    role: created.role,
    contractingEntityId: created.contractingEntity.id,
    contractingEntity: created.contractingEntity,
    accessLevel: created.accessLevel,
    status: created.status,
    initials: created.initials,
    avatarClassName: created.avatarClassName,
    hasPassword: created.hasPassword,
    hasAuthorizationPin: created.hasAuthorizationPin,
    lastAccessLabel: created.lastAccessLabel,
    pagePermissions: created.pagePermissions as PrefeituraCredentialUser['pagePermissions'],
  }
}

async function updatePrefeituraCredentialApi(
  accessToken: string,
  id: string,
  body: Parameters<typeof mock.updatePrefeituraCredential>[2],
): Promise<PrefeituraCredentialUser> {
  const updated = await api.updatePortalCredential(accessToken, id, {
    ...body,
    pagePermissions: body.pagePermissions as Parameters<typeof api.updatePortalCredential>[2]['pagePermissions'],
  })
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    cpf: body.cpf ?? '',
    role: updated.role,
    contractingEntityId: updated.contractingEntity.id,
    contractingEntity: updated.contractingEntity,
    accessLevel: updated.accessLevel,
    status: updated.status,
    initials: updated.initials,
    avatarClassName: updated.avatarClassName,
    hasPassword: updated.hasPassword,
    hasAuthorizationPin: updated.hasAuthorizationPin,
    lastAccessLabel: updated.lastAccessLabel,
    pagePermissions: updated.pagePermissions as PrefeituraCredentialUser['pagePermissions'],
  }
}

async function deactivatePrefeituraCredentialApi(accessToken: string, id: string) {
  const user = await api.deactivatePortalCredential(accessToken, id)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: '',
    role: user.role,
    contractingEntityId: user.contractingEntity.id,
    contractingEntity: user.contractingEntity,
    accessLevel: user.accessLevel,
    status: user.status,
    initials: user.initials,
    avatarClassName: user.avatarClassName,
    hasPassword: user.hasPassword,
    hasAuthorizationPin: user.hasAuthorizationPin,
    lastAccessLabel: user.lastAccessLabel,
    pagePermissions: user.pagePermissions as PrefeituraCredentialUser['pagePermissions'],
  }
}

async function activatePrefeituraCredentialApi(accessToken: string, id: string) {
  const user = await api.activatePortalCredential(accessToken, id)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: '',
    role: user.role,
    contractingEntityId: user.contractingEntity.id,
    contractingEntity: user.contractingEntity,
    accessLevel: user.accessLevel,
    status: user.status,
    initials: user.initials,
    avatarClassName: user.avatarClassName,
    hasPassword: user.hasPassword,
    hasAuthorizationPin: user.hasAuthorizationPin,
    lastAccessLabel: user.lastAccessLabel,
    pagePermissions: user.pagePermissions as PrefeituraCredentialUser['pagePermissions'],
  }
}

export const createPrefeituraCredential = useApi
  ? createPrefeituraCredentialApi
  : mock.createPrefeituraCredential
export const updatePrefeituraCredential = useApi
  ? updatePrefeituraCredentialApi
  : mock.updatePrefeituraCredential
export const deactivatePrefeituraCredential = useApi
  ? deactivatePrefeituraCredentialApi
  : mock.deactivatePrefeituraCredential
export const activatePrefeituraCredential = useApi
  ? activatePrefeituraCredentialApi
  : mock.activatePrefeituraCredential
export const deletePrefeituraCredential = useApi
  ? api.deletePortalCredential
  : mock.deletePrefeituraCredential
