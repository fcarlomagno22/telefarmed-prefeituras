import type {
  ConfigCommercialRules,
  ConfigContractType,
  ConfigExamCategory,
  ConfigExamItem,
  ConfigLegalDocument,
  ConfigProfession,
  ConfigSpecialty,
} from '../../../types/adminConfiguracoes'
import { adminConfiguracoesInitial } from '../../../data/adminConfiguracoesInitial'
import { mockDelay } from '../delay'

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

const state = JSON.parse(JSON.stringify(adminConfiguracoesInitial)) as typeof adminConfiguracoesInitial

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function fetchClinicoCatalog(): Promise<ClinicoCatalogResponse> {
  return mockDelay({ professions: clone(state.professions), specialties: clone(state.specialties) }, 50)
}

export async function saveClinicoCatalog(
  _accessToken: string,
  payload: SaveClinicoCatalogPayload,
): Promise<ClinicoCatalogResponse> {
  state.professions = payload.professions.map((profession) => ({
    ...profession,
    specialtyIds: payload.specialties
      .filter((specialty) => specialty.professionIds.includes(profession.id))
      .map((specialty) => specialty.id),
  }))
  state.specialties = clone(payload.specialties)
  return mockDelay({ professions: clone(state.professions), specialties: clone(state.specialties) }, 60)
}

export async function fetchContratosCatalog(): Promise<ContratosCatalogResponse> {
  return mockDelay(
    {
      contractTypes: clone(state.contractTypes),
      commercialRules: clone(state.commercialRules),
    },
    50,
  )
}

export async function createContractType(
  _accessToken: string,
  payload: CreateContractTypePayload,
): Promise<ConfigContractType> {
  const row: ConfigContractType = {
    id: payload.id,
    label: payload.label,
    description: payload.description,
    active: payload.active ?? true,
  }
  state.contractTypes = [row, ...state.contractTypes]
  return mockDelay(clone(row), 60)
}

export async function updateContractType(
  _accessToken: string,
  id: string,
  payload: UpdateContractTypePayload,
): Promise<ConfigContractType> {
  const row = state.contractTypes.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Tipo de contrato não encontrado.', 404)
  row.label = payload.label
  row.description = payload.description
  return mockDelay(clone(row), 60)
}

export async function setContractTypeStatus(
  _accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigContractType> {
  const row = state.contractTypes.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Tipo de contrato não encontrado.', 404)
  row.active = active
  return mockDelay(clone(row), 60)
}

export async function deleteContractType(_accessToken: string, id: string): Promise<void> {
  state.contractTypes = state.contractTypes.filter((item) => item.id !== id)
  return mockDelay(undefined, 50)
}

export async function saveCommercialRules(
  _accessToken: string,
  payload: ConfigCommercialRules,
): Promise<ConfigCommercialRules> {
  state.commercialRules = clone(payload)
  return mockDelay(clone(state.commercialRules), 60)
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

export async function fetchConsultaCatalog(): Promise<ConsultaCatalogResponse> {
  return mockDelay(
    {
      examCategories: state.examCategories.map(mapExamCategoryFromApi),
      examItems: state.examItems.map(mapExamItemFromApi),
    },
    50,
  )
}

export async function createExamCategory(
  _accessToken: string,
  payload: CreateExamCategoryPayload,
): Promise<ConfigExamCategory> {
  const created: ConfigExamCategory = {
    id: payload.id,
    name: payload.name,
    active: payload.active ?? true,
  }
  state.examCategories = [created, ...state.examCategories]
  return mockDelay(mapExamCategoryFromApi(created), 60)
}

export async function createExamCategoriesBulk(
  _accessToken: string,
  items: CreateExamCategoryPayload[],
): Promise<ConfigExamCategory[]> {
  const created = items.map((item) => ({ id: item.id, name: item.name, active: item.active ?? true }))
  state.examCategories = [...created, ...state.examCategories]
  return mockDelay(created.map(mapExamCategoryFromApi), 60)
}

export async function updateExamCategory(
  _accessToken: string,
  id: string,
  payload: UpdateExamCategoryPayload,
): Promise<ConfigExamCategory> {
  const row = state.examCategories.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Categoria não encontrada.', 404)
  row.name = payload.name
  return mockDelay(mapExamCategoryFromApi(row), 60)
}

export async function setExamCategoryStatus(
  _accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigExamCategory> {
  const row = state.examCategories.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Categoria não encontrada.', 404)
  row.active = active
  return mockDelay(mapExamCategoryFromApi(row), 60)
}

export async function deleteExamCategory(_accessToken: string, id: string): Promise<void> {
  state.examCategories = state.examCategories.filter((item) => item.id !== id)
  state.examItems = state.examItems.filter((item) => item.categoryId !== id)
  return mockDelay(undefined, 50)
}

export async function createExamItem(
  _accessToken: string,
  payload: CreateExamItemPayload,
): Promise<ConfigExamItem> {
  const created: ConfigExamItem = {
    id: payload.id,
    name: payload.name,
    categoryId: payload.categoryId,
    active: payload.active ?? true,
  }
  state.examItems = [created, ...state.examItems]
  return mockDelay(mapExamItemFromApi(created), 60)
}

export async function createExamItemsBulk(
  _accessToken: string,
  items: CreateExamItemPayload[],
): Promise<ConfigExamItem[]> {
  const created = items.map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    active: item.active ?? true,
  }))
  state.examItems = [...created, ...state.examItems]
  return mockDelay(created.map(mapExamItemFromApi), 60)
}

export async function updateExamItem(
  _accessToken: string,
  id: string,
  payload: UpdateExamItemPayload,
): Promise<ConfigExamItem> {
  const row = state.examItems.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Exame não encontrado.', 404)
  row.name = payload.name
  row.categoryId = payload.categoryId
  return mockDelay(mapExamItemFromApi(row), 60)
}

export async function setExamItemStatus(
  _accessToken: string,
  id: string,
  active: boolean,
): Promise<ConfigExamItem> {
  const row = state.examItems.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Exame não encontrado.', 404)
  row.active = active
  return mockDelay(mapExamItemFromApi(row), 60)
}

export async function deleteExamItem(_accessToken: string, id: string): Promise<void> {
  state.examItems = state.examItems.filter((item) => item.id !== id)
  return mockDelay(undefined, 50)
}

const BULK_REQUEST_CHUNK_SIZE = 100

export type DeleteExamItemsBulkPayload =
  | { ids: string[] }
  | { categoryId: string; allInCategory: true }

async function deleteExamItemsBulkOnce(
  _accessToken: string,
  payload: DeleteExamItemsBulkPayload,
): Promise<{ deletedCount: number; deletedIds: string[] }> {
  if ('allInCategory' in payload && payload.allInCategory) {
    const deletedIds = state.examItems
      .filter((item) => item.categoryId === payload.categoryId)
      .map((item) => item.id)
    state.examItems = state.examItems.filter((item) => item.categoryId !== payload.categoryId)
    return { deletedCount: deletedIds.length, deletedIds }
  }
  if (!('ids' in payload)) {
    return { deletedCount: 0, deletedIds: [] }
  }
  const ids = payload.ids
  const before = state.examItems.length
  state.examItems = state.examItems.filter((item) => !ids.includes(item.id))
  const deletedCount = before - state.examItems.length
  return { deletedCount, deletedIds: payload.ids.slice(0, deletedCount) }
}

export async function deleteExamItemsBulk(
  accessToken: string,
  payload: DeleteExamItemsBulkPayload,
): Promise<{ deletedCount: number; deletedIds: string[] }> {
  if ('allInCategory' in payload && payload.allInCategory) {
    return mockDelay(await deleteExamItemsBulkOnce(accessToken, payload), 60)
  }
  const ids = 'ids' in payload ? payload.ids : []
  if (ids.length === 0) {
    return mockDelay({ deletedCount: 0, deletedIds: [] }, 50)
  }
  const deletedIds: string[] = []
  let deletedCount = 0
  for (let index = 0; index < ids.length; index += BULK_REQUEST_CHUNK_SIZE) {
    const chunk = ids.slice(index, index + BULK_REQUEST_CHUNK_SIZE)
    const result = await deleteExamItemsBulkOnce(accessToken, { ids: chunk })
    deletedIds.push(...result.deletedIds)
    deletedCount += result.deletedCount
  }
  return mockDelay({ deletedCount, deletedIds }, 60)
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
  return mockDelay({ documents: state.legalDocuments.map(mapLegalDocumentFromApi) }, 50)
}

export async function createLegalDocument(
  _accessToken: string,
  payload: CreateLegalDocumentPayload,
): Promise<ConfigLegalDocument> {
  const created: ConfigLegalDocument = {
    id: payload.id,
    title: payload.title,
    content: payload.content ?? '',
    version: payload.version,
    updatedAtLabel: payload.updatedAtLabel,
    published: payload.published ?? false,
    portals: payload.portals,
  }
  state.legalDocuments = [created, ...state.legalDocuments]
  return mockDelay(mapLegalDocumentFromApi(created), 60)
}

export async function updateLegalDocument(
  _accessToken: string,
  id: string,
  payload: UpdateLegalDocumentPayload,
): Promise<ConfigLegalDocument> {
  const row = state.legalDocuments.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Documento não encontrado.', 404)
  row.title = payload.title
  row.content = payload.content
  row.version = payload.version
  row.updatedAtLabel = payload.updatedAtLabel
  row.portals = payload.portals
  return mockDelay(mapLegalDocumentFromApi(row), 60)
}

export async function setLegalDocumentPublished(
  _accessToken: string,
  id: string,
  published: boolean,
): Promise<ConfigLegalDocument> {
  const row = state.legalDocuments.find((item) => item.id === id)
  if (!row) throw new AdminConfiguracoesApiError('Documento não encontrado.', 404)
  row.published = published
  return mockDelay(mapLegalDocumentFromApi(row), 60)
}

export async function deleteLegalDocument(_accessToken: string, id: string): Promise<void> {
  state.legalDocuments = state.legalDocuments.filter((item) => item.id !== id)
  return mockDelay(undefined, 50)
}

export function isConfiguracoesApiError(error: unknown): error is AdminConfiguracoesApiError {
  return error instanceof AdminConfiguracoesApiError
}

export { AdminConfiguracoesApiError as AdminAuthApiError }
