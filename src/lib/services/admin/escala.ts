import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/escala'
import * as mock from '../../mockServices/admin/escala'

const useApi = isBackendApiEnabled()

export type EscalaScopePrefeituraApi = api.EscalaScopePrefeituraApi
export type EscalaScopeUbtApi = api.EscalaScopeUbtApi
export type EscalaSummaryApi = api.EscalaSummaryApi
export type EscalaDoctorOptionApi = api.EscalaDoctorOptionApi
export type EscalaPrefeituraCatalogApi = api.EscalaPrefeituraCatalogApi
export type EscalaUbtCatalogApi = api.EscalaUbtCatalogApi
export type EscalaSpecialtyCatalogApi = api.EscalaSpecialtyCatalogApi
export type EscalaCatalogApi = api.EscalaCatalogApi
export type EscalaContratoOptionApi = api.EscalaContratoOptionApi
export type BatchSavePayload = api.BatchSavePayload
export type EscalaInscricaoApi = api.EscalaInscricaoApi

export const AdminEscalaApiError = useApi ? api.AdminEscalaApiError : mock.AdminEscalaApiError

export const fetchAdminEscalaShifts = useApi ? api.fetchAdminEscalaShifts : mock.fetchAdminEscalaShifts
export const fetchAdminEscalaSummary = useApi ? api.fetchAdminEscalaSummary : mock.fetchAdminEscalaSummary
export const fetchAdminEscalaCatalog = useApi ? api.fetchAdminEscalaCatalog : mock.fetchAdminEscalaCatalog
export const fetchAdminEscalaContratos = useApi ? api.fetchAdminEscalaContratos : mock.fetchAdminEscalaContratos
export const saveAdminEscalaBatch = useApi ? api.saveAdminEscalaBatch : mock.saveAdminEscalaBatch
export const deleteAdminEscalaShifts = useApi ? api.deleteAdminEscalaShifts : mock.deleteAdminEscalaShifts
export const checkAdminEscalaConflicts = useApi ? api.checkAdminEscalaConflicts : mock.checkAdminEscalaConflicts
export const fetchAdminEscalaInscricoes = useApi ? api.fetchAdminEscalaInscricoes : mock.fetchAdminEscalaInscricoes
export const acceptAdminEscalaInscricao = useApi ? api.acceptAdminEscalaInscricao : mock.acceptAdminEscalaInscricao
export const rejectAdminEscalaInscricao = useApi ? api.rejectAdminEscalaInscricao : mock.rejectAdminEscalaInscricao
export const cancelAdminEscalaPlantao = useApi ? api.cancelAdminEscalaPlantao : mock.cancelAdminEscalaPlantao
export const isAdminEscalaApiError = useApi ? api.isAdminEscalaApiError : mock.isAdminEscalaApiError
