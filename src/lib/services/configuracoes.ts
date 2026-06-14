import { isBackendApiEnabled } from '../api/config'
import * as api from '../api/configuracoes'
import * as mock from '../mockServices/admin/configuracoes'

const useApi = isBackendApiEnabled()

export type ClinicoCatalogResponse = api.PublicClinicoCatalogResponse

export async function fetchPublicClinicoCatalog(activeOnly = true): Promise<ClinicoCatalogResponse> {
  if (!useApi) {
    const catalog = await mock.fetchClinicoCatalog()
    if (!activeOnly) return catalog
    return {
      professions: catalog.professions.filter((profession) => profession.active),
      specialties: catalog.specialties.filter((specialty) => specialty.active),
    }
  }
  return api.fetchPublicClinicoCatalog(activeOnly)
}
