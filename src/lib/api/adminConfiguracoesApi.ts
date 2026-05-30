import type {
  ConfigCommercialRules,
  ConfigContractType,
  ConfigExamCategory,
  ConfigExamItem,
  ConfigLegalDocument,
  ConfigProfession,
  ConfigSpecialty,
} from '../../types/adminConfiguracoes'
import { AdminAuthApiError } from './adminAuthApi'

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

type ApiErrorBody = {
  error?: string
  code?: string
}

export class AdminConfiguracoesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminConfiguracoesApiError'
    this.status = status
    this.code = code
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const adminCatalogFetchInit: RequestInit = { cache: 'no-store' }

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

async function request<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const headers = new Headers(init?.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const hasJsonBody = init?.body != null && init.body !== ''
  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  const body = await parseJson<ApiErrorBody & T>(response)

  if (!response.ok) {
    throw new AdminConfiguracoesApiError(
      body.error ?? 'Não foi possível concluir a operação.',
      response.status,
      body.code,
    )
  }

  return body
}

export async function fetchClinicoCatalog(): Promise<ClinicoCatalogResponse> {
  return request<ClinicoCatalogResponse>('/api/v1/configuracoes/clinico')
}

export async function saveClinicoCatalog(
  accessToken: string,
  payload: SaveClinicoCatalogPayload,
): Promise<ClinicoCatalogResponse> {
  return request<ClinicoCatalogResponse>(
    '/api/v1/admin/configuracoes/clinico',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
}

export async function fetchContratosCatalog(): Promise<ContratosCatalogResponse> {
  return request<ContratosCatalogResponse>('/api/v1/configuracoes/contratos')
}

export async function createContractType(
  accessToken: string,
  payload: CreateContractTypePayload,
): Promise<ConfigContractType> {
  return request<ConfigContractType>(
    '/api/v1/admin/configuracoes/contratos/tipos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
}

export async function updateContractType(
  accessToken: string,
  id: string,
  payload: UpdateContractTypePayload,
): Promise<ConfigContractType> {
  return request<ConfigContractType>(
    `/api/v1/admin/configuracoes/contratos/tipos/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
}

export async function setContractTypeStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigContractType> {
  return request<ConfigContractType>(
    `/api/v1/admin/configuracoes/contratos/tipos/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    },
    accessToken,
  )
}

export async function deleteContractType(accessToken: string, id: string): Promise<void> {
  await request<void>(
    `/api/v1/admin/configuracoes/contratos/tipos/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    accessToken,
  )
}

export async function saveCommercialRules(
  accessToken: string,
  payload: ConfigCommercialRules,
): Promise<ConfigCommercialRules> {
  return request<ConfigCommercialRules>(
    '/api/v1/admin/configuracoes/contratos/regras-comerciais',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
}

function mapExamCategoryFromApi(
  row: ConfigExamCategory & { sortOrder?: number },
): ConfigExamCategory {
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

export async function fetchConsultaCatalog(): Promise<ConsultaCatalogResponse> {
  const catalog = await request<ConsultaCatalogResponse>('/api/v1/configuracoes/consulta')
  return {
    examCategories: catalog.examCategories.map(mapExamCategoryFromApi),
    examItems: catalog.examItems.map(mapExamItemFromApi),
  }
}

export async function createExamCategory(
  accessToken: string,
  payload: CreateExamCategoryPayload,
): Promise<ConfigExamCategory> {
  const created = await request<ConfigExamCategory & { sortOrder?: number }>(
    '/api/v1/admin/configuracoes/consulta/categorias',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
  return mapExamCategoryFromApi(created)
}

export async function updateExamCategory(
  accessToken: string,
  id: string,
  payload: UpdateExamCategoryPayload,
): Promise<ConfigExamCategory> {
  const updated = await request<ConfigExamCategory & { sortOrder?: number }>(
    `/api/v1/admin/configuracoes/consulta/categorias/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
  return mapExamCategoryFromApi(updated)
}

export async function setExamCategoryStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigExamCategory> {
  const updated = await request<ConfigExamCategory & { sortOrder?: number }>(
    `/api/v1/admin/configuracoes/consulta/categorias/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    },
    accessToken,
  )
  return mapExamCategoryFromApi(updated)
}

export async function deleteExamCategory(accessToken: string, id: string): Promise<void> {
  await request<void>(
    `/api/v1/admin/configuracoes/consulta/categorias/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    accessToken,
  )
}

export async function createExamItem(
  accessToken: string,
  payload: CreateExamItemPayload,
): Promise<ConfigExamItem> {
  const created = await request<ConfigExamItem & { sortOrder?: number }>(
    '/api/v1/admin/configuracoes/consulta/exames',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
  return mapExamItemFromApi(created)
}

export async function updateExamItem(
  accessToken: string,
  id: string,
  payload: UpdateExamItemPayload,
): Promise<ConfigExamItem> {
  const updated = await request<ConfigExamItem & { sortOrder?: number }>(
    `/api/v1/admin/configuracoes/consulta/exames/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
  return mapExamItemFromApi(updated)
}

export async function setExamItemStatus(
  accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigExamItem> {
  const updated = await request<ConfigExamItem & { sortOrder?: number }>(
    `/api/v1/admin/configuracoes/consulta/exames/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    },
    accessToken,
  )
  return mapExamItemFromApi(updated)
}

export async function deleteExamItem(accessToken: string, id: string): Promise<void> {
  await request<void>(
    `/api/v1/admin/configuracoes/consulta/exames/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    accessToken,
  )
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

export async function fetchLegalCatalog(): Promise<LegalCatalogResponse> {
  const catalog = await request<LegalCatalogResponse>(
    '/api/v1/admin/configuracoes/legal',
    adminCatalogFetchInit,
  )
  return {
    documents: catalog.documents.map(mapLegalDocumentFromApi),
  }
}

export async function createLegalDocument(
  accessToken: string,
  payload: CreateLegalDocumentPayload,
): Promise<ConfigLegalDocument> {
  const created = await request<ConfigLegalDocument & { sortOrder?: number }>(
    '/api/v1/admin/configuracoes/legal/documentos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
  return mapLegalDocumentFromApi(created)
}

export async function updateLegalDocument(
  accessToken: string,
  id: string,
  payload: UpdateLegalDocumentPayload,
): Promise<ConfigLegalDocument> {
  const updated = await request<ConfigLegalDocument & { sortOrder?: number }>(
    `/api/v1/admin/configuracoes/legal/documentos/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    accessToken,
  )
  return mapLegalDocumentFromApi(updated)
}

export async function setLegalDocumentPublished(
  accessToken: string,
  id: string,
  published: boolean,
): Promise<ConfigLegalDocument> {
  const updated = await request<ConfigLegalDocument & { sortOrder?: number }>(
    `/api/v1/admin/configuracoes/legal/documentos/${encodeURIComponent(id)}/publicacao`,
    {
      method: 'PATCH',
      body: JSON.stringify({ published }),
    },
    accessToken,
  )
  return mapLegalDocumentFromApi(updated)
}

export async function deleteLegalDocument(accessToken: string, id: string): Promise<void> {
  await request<void>(
    `/api/v1/admin/configuracoes/legal/documentos/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    accessToken,
  )
}

export function isConfiguracoesApiError(error: unknown): error is AdminConfiguracoesApiError {
  return error instanceof AdminConfiguracoesApiError
}

export { AdminAuthApiError }
