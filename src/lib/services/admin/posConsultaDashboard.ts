import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/posConsultaDashboard'
import {
  fetchAdminPosConsultaDashboard as mockFetchAdminPosConsultaDashboard,
  isAdminPosConsultaDashboardApiError as mockIsAdminPosConsultaDashboardApiError,
  mapAdminPosConsultaDashboardToKpiCards,
  AdminPosConsultaDashboardApiError as MockAdminPosConsultaDashboardApiError,
} from '../../mockServices/admin/posConsultaDashboard'
import type { AdminPosConsultaDashboardFilters } from '../../../types/adminPosConsultaDashboard'

export type {
  AdminPosConsultaClienteBreakdownRow,
  AdminPosConsultaDashboardFilters,
  AdminPosConsultaDashboardView,
} from '../../../types/adminPosConsultaDashboard'

export { mapAdminPosConsultaDashboardToKpiCards }

export const AdminPosConsultaDashboardApiError = isBackendApiEnabled()
  ? api.AdminPosConsultaDashboardApiError
  : MockAdminPosConsultaDashboardApiError

export const isAdminPosConsultaDashboardApiError = isBackendApiEnabled()
  ? api.isAdminPosConsultaDashboardApiError
  : mockIsAdminPosConsultaDashboardApiError

export async function fetchAdminPosConsultaDashboard(
  accessToken: string,
  filters: AdminPosConsultaDashboardFilters,
) {
  if (isBackendApiEnabled()) {
    return api.apiFetchAdminPosConsultaDashboard(accessToken, filters)
  }
  return mockFetchAdminPosConsultaDashboard(accessToken, filters)
}
