import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/clientes'
import * as mock from '../../mockServices/admin/clientes'

const useApi = isBackendApiEnabled()

export type ClientesSummaryResponse = api.ClientesSummaryResponse
export type ClinicoCatalogResponse = api.ClinicoCatalogResponse
export type ClinicoProfessionApi = api.ClinicoProfessionApi
export type ClinicoSpecialtyApi = api.ClinicoSpecialtyApi
export type ClienteContratoCatalogResponse = api.ClienteContratoCatalogResponse
export type ClienteContratoTipoApi = api.ClienteContratoTipoApi
export type ListEntidadesParams = api.ListEntidadesParams
export type CreateEntidadePayload = api.CreateEntidadePayload
export type UpdateEntidadeContactsPayload = api.UpdateEntidadeContactsPayload
export type UpdateEntidadePayload = api.UpdateEntidadePayload
export type UpdateEntidadeStatusPayload = api.UpdateEntidadeStatusPayload
export type CreateContratoPayload = api.CreateContratoPayload
export type UpdateContratoPayload = api.UpdateContratoPayload
export type ClienteUbtPayload = api.ClienteUbtPayload

export const AdminClientesApiError = useApi ? api.AdminClientesApiError : mock.AdminClientesApiError

export const fetchClientesSummary = useApi ? api.fetchClientesSummary : mock.fetchClientesSummary
export const fetchClientesClinicoCatalog = useApi
  ? api.fetchClientesClinicoCatalog
  : mock.fetchClientesClinicoCatalog
export const fetchClientesContratoCatalog = useApi
  ? api.fetchClientesContratoCatalog
  : mock.fetchClientesContratoCatalog
export const fetchClientesEntidades = useApi ? api.fetchClientesEntidades : mock.fetchClientesEntidades
export const fetchClienteEntidade = useApi ? api.fetchClienteEntidade : mock.fetchClienteEntidade
export const fetchClienteUbts = useApi ? api.fetchClienteUbts : mock.fetchClienteUbts
export const createClienteUbt = useApi ? api.createClienteUbt : mock.createClienteUbt
export const updateClienteUbt = useApi ? api.updateClienteUbt : mock.updateClienteUbt
export const deleteClienteUbt = useApi ? api.deleteClienteUbt : mock.deleteClienteUbt
export const createClienteEntidade = useApi ? api.createClienteEntidade : mock.createClienteEntidade
export const updateClienteEntidadeStatus = useApi
  ? api.updateClienteEntidadeStatus
  : mock.updateClienteEntidadeStatus
export const updateClienteEntidadeContacts = useApi
  ? api.updateClienteEntidadeContacts
  : mock.updateClienteEntidadeContacts
export const updateClienteEntidade = useApi ? api.updateClienteEntidade : mock.updateClienteEntidade
export const deleteClienteEntidade = useApi ? api.deleteClienteEntidade : mock.deleteClienteEntidade
export const createClienteContrato = useApi ? api.createClienteContrato : mock.createClienteContrato
export const updateClienteContratoStatus = useApi
  ? api.updateClienteContratoStatus
  : mock.updateClienteContratoStatus
export const updateClienteContrato = useApi ? api.updateClienteContrato : mock.updateClienteContrato
export const deleteClienteContrato = useApi ? api.deleteClienteContrato : mock.deleteClienteContrato
export const isAdminClientesApiError = useApi ? api.isAdminClientesApiError : mock.isAdminClientesApiError

export type { AdminClienteContrato, AdminClienteRow } from '../../api/admin/clientes'
