import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/configuracoes'
import * as mock from '../../mockServices/admin/configuracoes'

const useApi = isBackendApiEnabled()

export type ClinicoCatalogResponse = api.ClinicoCatalogResponse
export type ContratosCatalogResponse = api.ContratosCatalogResponse
export type ConsultaCatalogResponse = api.ConsultaCatalogResponse
export type LegalCatalogResponse = api.LegalCatalogResponse
export type SaveClinicoCatalogPayload = api.SaveClinicoCatalogPayload
export type CreateContractTypePayload = api.CreateContractTypePayload
export type UpdateContractTypePayload = api.UpdateContractTypePayload
export type CreateExamCategoryPayload = api.CreateExamCategoryPayload
export type UpdateExamCategoryPayload = api.UpdateExamCategoryPayload
export type CreateExamItemPayload = api.CreateExamItemPayload
export type UpdateExamItemPayload = api.UpdateExamItemPayload
export type CreateLegalDocumentPayload = api.CreateLegalDocumentPayload
export type UpdateLegalDocumentPayload = api.UpdateLegalDocumentPayload
export type DeleteExamItemsBulkPayload = api.DeleteExamItemsBulkPayload

export const AdminConfiguracoesApiError = useApi
  ? api.AdminConfiguracoesApiError
  : mock.AdminConfiguracoesApiError

function requireAccessToken(accessToken: string | null | undefined): string {
  if (!accessToken) {
    throw new AdminConfiguracoesApiError('Sessão expirada. Faça login novamente.', 401)
  }
  return accessToken
}

export async function fetchClinicoCatalog(accessToken?: string | null) {
  if (!useApi) return mock.fetchClinicoCatalog()
  return api.fetchClinicoCatalog(requireAccessToken(accessToken))
}

export async function saveClinicoCatalog(
  accessToken: string | null | undefined,
  payload: SaveClinicoCatalogPayload,
) {
  if (!useApi) return mock.saveClinicoCatalog(requireAccessToken(accessToken), payload)
  return api.saveClinicoCatalog(requireAccessToken(accessToken), payload)
}

export async function fetchContratosCatalog(accessToken?: string | null) {
  if (!useApi) return mock.fetchContratosCatalog()
  return api.fetchContratosCatalog(requireAccessToken(accessToken))
}

export async function createContractType(
  accessToken: string | null | undefined,
  payload: CreateContractTypePayload,
) {
  if (!useApi) return mock.createContractType(requireAccessToken(accessToken), payload)
  return api.createContractType(requireAccessToken(accessToken), payload)
}

export async function updateContractType(
  accessToken: string | null | undefined,
  id: string,
  payload: UpdateContractTypePayload,
) {
  if (!useApi) return mock.updateContractType(requireAccessToken(accessToken), id, payload)
  return api.updateContractType(requireAccessToken(accessToken), id, payload)
}

export async function setContractTypeStatus(
  accessToken: string | null | undefined,
  id: string,
  active: boolean,
) {
  if (!useApi) return mock.setContractTypeStatus(requireAccessToken(accessToken), id, active)
  return api.setContractTypeStatus(requireAccessToken(accessToken), id, active)
}

export async function deleteContractType(accessToken: string | null | undefined, id: string) {
  if (!useApi) return mock.deleteContractType(requireAccessToken(accessToken), id)
  return api.deleteContractType(requireAccessToken(accessToken), id)
}

export async function saveCommercialRules(
  accessToken: string | null | undefined,
  payload: api.ContratosCatalogResponse['commercialRules'],
) {
  if (!useApi) return mock.saveCommercialRules(requireAccessToken(accessToken), payload)
  return api.saveCommercialRules(requireAccessToken(accessToken), payload)
}

export async function fetchConsultaCatalog(accessToken?: string | null) {
  if (!useApi) return mock.fetchConsultaCatalog()
  return api.fetchConsultaCatalog(requireAccessToken(accessToken))
}

export async function createExamCategory(
  accessToken: string | null | undefined,
  payload: CreateExamCategoryPayload,
) {
  if (!useApi) return mock.createExamCategory(requireAccessToken(accessToken), payload)
  return api.createExamCategory(requireAccessToken(accessToken), payload)
}

export async function createExamCategoriesBulk(
  accessToken: string | null | undefined,
  items: CreateExamCategoryPayload[],
) {
  if (!useApi) return mock.createExamCategoriesBulk(requireAccessToken(accessToken), items)
  return api.createExamCategoriesBulk(requireAccessToken(accessToken), items)
}

export async function updateExamCategory(
  accessToken: string | null | undefined,
  id: string,
  payload: UpdateExamCategoryPayload,
) {
  if (!useApi) return mock.updateExamCategory(requireAccessToken(accessToken), id, payload)
  return api.updateExamCategory(requireAccessToken(accessToken), id, payload)
}

export async function setExamCategoryStatus(
  accessToken: string | null | undefined,
  id: string,
  active: boolean,
) {
  if (!useApi) return mock.setExamCategoryStatus(requireAccessToken(accessToken), id, active)
  return api.setExamCategoryStatus(requireAccessToken(accessToken), id, active)
}

export async function deleteExamCategory(accessToken: string | null | undefined, id: string) {
  if (!useApi) return mock.deleteExamCategory(requireAccessToken(accessToken), id)
  return api.deleteExamCategory(requireAccessToken(accessToken), id)
}

export async function createExamItem(
  accessToken: string | null | undefined,
  payload: CreateExamItemPayload,
) {
  if (!useApi) return mock.createExamItem(requireAccessToken(accessToken), payload)
  return api.createExamItem(requireAccessToken(accessToken), payload)
}

export async function createExamItemsBulk(
  accessToken: string | null | undefined,
  items: CreateExamItemPayload[],
) {
  if (!useApi) return mock.createExamItemsBulk(requireAccessToken(accessToken), items)
  return api.createExamItemsBulk(requireAccessToken(accessToken), items)
}

export async function updateExamItem(
  accessToken: string | null | undefined,
  id: string,
  payload: UpdateExamItemPayload,
) {
  if (!useApi) return mock.updateExamItem(requireAccessToken(accessToken), id, payload)
  return api.updateExamItem(requireAccessToken(accessToken), id, payload)
}

export async function setExamItemStatus(
  accessToken: string | null | undefined,
  id: string,
  active: boolean,
) {
  if (!useApi) return mock.setExamItemStatus(requireAccessToken(accessToken), id, active)
  return api.setExamItemStatus(requireAccessToken(accessToken), id, active)
}

export async function deleteExamItem(accessToken: string | null | undefined, id: string) {
  if (!useApi) return mock.deleteExamItem(requireAccessToken(accessToken), id)
  return api.deleteExamItem(requireAccessToken(accessToken), id)
}

export async function deleteExamItemsBulk(
  accessToken: string | null | undefined,
  payload: DeleteExamItemsBulkPayload,
) {
  if (!useApi) return mock.deleteExamItemsBulk(requireAccessToken(accessToken), payload)
  return api.deleteExamItemsBulk(requireAccessToken(accessToken), payload)
}

export async function fetchLegalCatalog(accessToken?: string | null) {
  if (!useApi) return mock.fetchLegalCatalog()
  return api.fetchLegalCatalog(requireAccessToken(accessToken))
}

export async function createLegalDocument(
  accessToken: string | null | undefined,
  payload: CreateLegalDocumentPayload,
) {
  if (!useApi) return mock.createLegalDocument(requireAccessToken(accessToken), payload)
  return api.createLegalDocument(requireAccessToken(accessToken), payload)
}

export async function updateLegalDocument(
  accessToken: string | null | undefined,
  id: string,
  payload: UpdateLegalDocumentPayload,
) {
  if (!useApi) return mock.updateLegalDocument(requireAccessToken(accessToken), id, payload)
  return api.updateLegalDocument(requireAccessToken(accessToken), id, payload)
}

export async function setLegalDocumentPublished(
  accessToken: string | null | undefined,
  id: string,
  published: boolean,
) {
  if (!useApi) return mock.setLegalDocumentPublished(requireAccessToken(accessToken), id, published)
  return api.setLegalDocumentPublished(requireAccessToken(accessToken), id, published)
}

export async function deleteLegalDocument(accessToken: string | null | undefined, id: string) {
  if (!useApi) return mock.deleteLegalDocument(requireAccessToken(accessToken), id)
  return api.deleteLegalDocument(requireAccessToken(accessToken), id)
}

export const isConfiguracoesApiError = useApi ? api.isConfiguracoesApiError : mock.isConfiguracoesApiError
