import type {
  ConfigCommercialRules,
  ConfigContractType,
  ConfigExamCategory,
  ConfigExamItem,
  ConfigLegalDocument,
  ConfigProfession,
  ConfigSpecialty,
} from '../../../types/adminConfiguracoes'
import { ApiError, apiFetch } from '../http'

export class AdminConfiguracoesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminConfiguracoesApiError'
  }
}

function mapError(error: unknown): AdminConfiguracoesApiError {
  if (error instanceof ApiError) {
    return new AdminConfiguracoesApiError(error.message, error.status, error.code)
  }
  return new AdminConfiguracoesApiError('Não foi possível completar a requisição.', 0)
}

async function adminFetch<T>(path: string, accessToken: string, options: RequestInit & { json?: unknown } = {}) {
  try {
    return await apiFetch<T>(`/admin/configuracoes${path}`, { ...options, accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export type ClinicoCatalogResponse = {
  professions: ConfigProfession[]
  specialties: ConfigSpecialty[]
}

export type ContratosCatalogResponse = {
  contractTypes: ConfigContractType[]
  commercialRules: ConfigCommercialRules
}

export type ConsultaCatalogResponse = {
  examCategories: ConfigExamCategory[]
  examItems: ConfigExamItem[]
}

export type LegalCatalogResponse = {
  documents: ConfigLegalDocument[]
}

export type SaveClinicoCatalogPayload = {
  professions: Omit<ConfigProfession, 'specialtyIds'>[]
  specialties: ConfigSpecialty[]
}

export type CreateContractTypePayload = {
  id: string
  label: string
  description: string
  active?: boolean
}

export type UpdateContractTypePayload = {
  label: string
  description: string
}

export type CreateExamCategoryPayload = {
  id: string
  name: string
  active?: boolean
}

export type UpdateExamCategoryPayload = {
  name: string
}

export type CreateExamItemPayload = {
  id: string
  name: string
  categoryId: string
  active?: boolean
}

export type UpdateExamItemPayload = {
  name: string
  categoryId: string
}

export type CreateLegalDocumentPayload = {
  id: string
  title: string
  content?: string
  version: string
  updatedAtLabel: string
  published?: boolean
  portals: ConfigLegalDocument['portals']
}

export type UpdateLegalDocumentPayload = {
  title: string
  content: string
  version: string
  updatedAtLabel: string
  portals: ConfigLegalDocument['portals']
}

export type DeleteExamItemsBulkPayload =
  | { ids: string[] }
  | { categoryId: string; allInCategory: true }

const BULK_REQUEST_CHUNK_SIZE = 100

function mapContractTypeFromApi(row: ConfigContractType & { sortOrder?: number }): ConfigContractType {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    active: row.active,
  }
}

function mapExamCategoryFromApi(row: ConfigExamCategory & { sortOrder?: number }): ConfigExamCategory {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
  }
}

function mapExamItemFromApi(row: ConfigExamItem & { sortOrder?: number }): ConfigExamItem {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    active: row.active,
  }
}

function mapLegalDocumentFromApi(
  row: ConfigLegalDocument & { sortOrder?: number },
): ConfigLegalDocument {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    version: row.version,
    updatedAtLabel: row.updatedAtLabel,
    published: row.published,
    portals: row.portals,
  }
}

export async function fetchClinicoCatalog(accessToken: string): Promise<ClinicoCatalogResponse> {
  return adminFetch<ClinicoCatalogResponse>('/clinico', accessToken)
}

export async function saveClinicoCatalog(
  accessToken: string,
  payload: SaveClinicoCatalogPayload,
): Promise<ClinicoCatalogResponse> {
  return adminFetch<ClinicoCatalogResponse>('/clinico', accessToken, {
    method: 'PUT',
    json: payload,
  })
}

export async function fetchContratosCatalog(accessToken: string): Promise<ContratosCatalogResponse> {
  const catalog = await adminFetch<ContratosCatalogResponse>('/contratos', accessToken)
  return {
    ...catalog,
    contractTypes: catalog.contractTypes.map(mapContractTypeFromApi),
  }
}

export async function createContractType(
  accessToken: string,
  payload: CreateContractTypePayload,
): Promise<ConfigContractType> {
  const row = await adminFetch<ConfigContractType>('/contratos/tipos', accessToken, {
    method: 'POST',
    json: payload,
  })
  return mapContractTypeFromApi(row)
}

export async function updateContractType(
  accessToken: string,
  id: string,
  payload: UpdateContractTypePayload,
): Promise<ConfigContractType> {
  const row = await adminFetch<ConfigContractType>(`/contratos/tipos/${encodeURIComponent(id)}`, accessToken, {
    method: 'PUT',
    json: payload,
  })
  return mapContractTypeFromApi(row)
}

export async function setContractTypeStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigContractType> {
  const row = await adminFetch<ConfigContractType>(
    `/contratos/tipos/${encodeURIComponent(id)}/status`,
    accessToken,
    { method: 'PATCH', json: { active } },
  )
  return mapContractTypeFromApi(row)
}

export async function deleteContractType(accessToken: string, id: string): Promise<void> {
  await adminFetch<void>(`/contratos/tipos/${encodeURIComponent(id)}`, accessToken, { method: 'DELETE' })
}

export async function saveCommercialRules(
  accessToken: string,
  payload: ConfigCommercialRules,
): Promise<ConfigCommercialRules> {
  return adminFetch<ConfigCommercialRules>('/contratos/regras-comerciais', accessToken, {
    method: 'PUT',
    json: payload,
  })
}

export async function fetchConsultaCatalog(accessToken: string): Promise<ConsultaCatalogResponse> {
  const catalog = await adminFetch<ConsultaCatalogResponse>('/consulta', accessToken)
  return {
    examCategories: catalog.examCategories.map(mapExamCategoryFromApi),
    examItems: catalog.examItems.map(mapExamItemFromApi),
  }
}

export async function createExamCategory(
  accessToken: string,
  payload: CreateExamCategoryPayload,
): Promise<ConfigExamCategory> {
  const row = await adminFetch<ConfigExamCategory>('/consulta/categorias', accessToken, {
    method: 'POST',
    json: payload,
  })
  return mapExamCategoryFromApi(row)
}

export async function createExamCategoriesBulk(
  accessToken: string,
  items: CreateExamCategoryPayload[],
): Promise<ConfigExamCategory[]> {
  const rows = await adminFetch<(ConfigExamCategory & { sortOrder?: number })[]>(
    '/consulta/categorias/bulk',
    accessToken,
    { method: 'POST', json: { items } },
  )
  return rows.map(mapExamCategoryFromApi)
}

export async function updateExamCategory(
  accessToken: string,
  id: string,
  payload: UpdateExamCategoryPayload,
): Promise<ConfigExamCategory> {
  const row = await adminFetch<ConfigExamCategory>(
    `/consulta/categorias/${encodeURIComponent(id)}`,
    accessToken,
    { method: 'PUT', json: payload },
  )
  return mapExamCategoryFromApi(row)
}

export async function setExamCategoryStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigExamCategory> {
  const row = await adminFetch<ConfigExamCategory>(
    `/consulta/categorias/${encodeURIComponent(id)}/status`,
    accessToken,
    { method: 'PATCH', json: { active } },
  )
  return mapExamCategoryFromApi(row)
}

export async function deleteExamCategory(accessToken: string, id: string): Promise<void> {
  await adminFetch<void>(`/consulta/categorias/${encodeURIComponent(id)}`, accessToken, {
    method: 'DELETE',
  })
}

export async function createExamItem(
  accessToken: string,
  payload: CreateExamItemPayload,
): Promise<ConfigExamItem> {
  const row = await adminFetch<ConfigExamItem>('/consulta/exames', accessToken, {
    method: 'POST',
    json: payload,
  })
  return mapExamItemFromApi(row)
}

export async function createExamItemsBulk(
  accessToken: string,
  items: CreateExamItemPayload[],
): Promise<ConfigExamItem[]> {
  const rows = await adminFetch<(ConfigExamItem & { sortOrder?: number })[]>(
    '/consulta/exames/bulk',
    accessToken,
    { method: 'POST', json: { items } },
  )
  return rows.map(mapExamItemFromApi)
}

export async function updateExamItem(
  accessToken: string,
  id: string,
  payload: UpdateExamItemPayload,
): Promise<ConfigExamItem> {
  const row = await adminFetch<ConfigExamItem>(`/consulta/exames/${encodeURIComponent(id)}`, accessToken, {
    method: 'PUT',
    json: payload,
  })
  return mapExamItemFromApi(row)
}

export async function setExamItemStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigExamItem> {
  const row = await adminFetch<ConfigExamItem>(
    `/consulta/exames/${encodeURIComponent(id)}/status`,
    accessToken,
    { method: 'PATCH', json: { active } },
  )
  return mapExamItemFromApi(row)
}

export async function deleteExamItem(accessToken: string, id: string): Promise<void> {
  await adminFetch<void>(`/consulta/exames/${encodeURIComponent(id)}`, accessToken, { method: 'DELETE' })
}

async function deleteExamItemsBulkOnce(
  accessToken: string,
  payload: DeleteExamItemsBulkPayload,
): Promise<{ deletedCount: number; deletedIds: string[] }> {
  return adminFetch<{ deletedCount: number; deletedIds: string[] }>(
    '/consulta/exames/bulk-delete',
    accessToken,
    { method: 'POST', json: payload },
  )
}

export async function deleteExamItemsBulk(
  accessToken: string,
  payload: DeleteExamItemsBulkPayload,
): Promise<{ deletedCount: number; deletedIds: string[] }> {
  if ('allInCategory' in payload && payload.allInCategory) {
    return deleteExamItemsBulkOnce(accessToken, payload)
  }

  const ids = 'ids' in payload ? payload.ids : []
  if (ids.length === 0) {
    return { deletedCount: 0, deletedIds: [] }
  }

  const deletedIds: string[] = []
  let deletedCount = 0

  for (let index = 0; index < ids.length; index += BULK_REQUEST_CHUNK_SIZE) {
    const chunk = ids.slice(index, index + BULK_REQUEST_CHUNK_SIZE)
    const result = await deleteExamItemsBulkOnce(accessToken, { ids: chunk })
    deletedIds.push(...result.deletedIds)
    deletedCount += result.deletedCount
  }

  return { deletedCount, deletedIds }
}

export async function fetchLegalCatalog(accessToken: string): Promise<LegalCatalogResponse> {
  const catalog = await adminFetch<LegalCatalogResponse>('/legal', accessToken)
  return {
    documents: catalog.documents.map(mapLegalDocumentFromApi),
  }
}

export async function createLegalDocument(
  accessToken: string,
  payload: CreateLegalDocumentPayload,
): Promise<ConfigLegalDocument> {
  const row = await adminFetch<ConfigLegalDocument>('/legal/documentos', accessToken, {
    method: 'POST',
    json: payload,
  })
  return mapLegalDocumentFromApi(row)
}

export async function updateLegalDocument(
  accessToken: string,
  id: string,
  payload: UpdateLegalDocumentPayload,
): Promise<ConfigLegalDocument> {
  const row = await adminFetch<ConfigLegalDocument>(
    `/legal/documentos/${encodeURIComponent(id)}`,
    accessToken,
    { method: 'PUT', json: payload },
  )
  return mapLegalDocumentFromApi(row)
}

export async function setLegalDocumentPublished(
  accessToken: string,
  id: string,
  published: boolean,
): Promise<ConfigLegalDocument> {
  const row = await adminFetch<ConfigLegalDocument>(
    `/legal/documentos/${encodeURIComponent(id)}/publicacao`,
    accessToken,
    { method: 'PATCH', json: { published } },
  )
  return mapLegalDocumentFromApi(row)
}

export async function deleteLegalDocument(accessToken: string, id: string): Promise<void> {
  await adminFetch<void>(`/legal/documentos/${encodeURIComponent(id)}`, accessToken, {
    method: 'DELETE',
  })
}

export function isConfiguracoesApiError(error: unknown): error is AdminConfiguracoesApiError {
  return error instanceof AdminConfiguracoesApiError
}
