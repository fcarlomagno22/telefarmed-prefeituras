import { buildAdminPosConsultaDashboardMock } from '../../../data/adminPosConsultaMock'
import type { AdminPosConsultaDashboardFilters, AdminPosConsultaDashboardView } from '../../../types/adminPosConsultaDashboard'
import { mapPrefeituraPosConsultaDashboardToKpiCards } from '../prefeitura/posConsultaDashboard'
import { mockDelay } from '../delay'

export class AdminPosConsultaDashboardApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminPosConsultaDashboardApiError'
    this.status = status
    this.code = code
  }
}

export function isAdminPosConsultaDashboardApiError(
  error: unknown,
): error is AdminPosConsultaDashboardApiError {
  return error instanceof AdminPosConsultaDashboardApiError
}

export const mapAdminPosConsultaDashboardToKpiCards = mapPrefeituraPosConsultaDashboardToKpiCards

export async function fetchAdminPosConsultaDashboard(
  _accessToken: string,
  filters: AdminPosConsultaDashboardFilters,
): Promise<AdminPosConsultaDashboardView> {
  // TODO: conectar API real na fase backend (/admin/dashboard/pos-consulta)
  return mockDelay(buildAdminPosConsultaDashboardMock(filters))
}
