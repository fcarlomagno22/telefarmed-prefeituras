import type { VdPublicTenantResponse } from '../../../types/vdTenant'
import type { VdTenantScope } from '../../../types/vdApi'
import { VdApiError, vdRequest } from './client'

export async function fetchTenant(scope?: VdTenantScope): Promise<VdPublicTenantResponse> {
  try {
    return await vdRequest<VdPublicTenantResponse>({
      method: 'GET',
      path: '/vd/tenant',
      tenantScope: scope,
      credentials: 'omit',
      redirect: 'manual',
    })
  } catch (error) {
    if (error instanceof VdApiError) {
      if (error.status === 404) throw new Error('TENANT_NOT_FOUND')
      if (error.code === 'TENANT_REDIRECT') throw new Error('TENANT_REDIRECT')
      throw new Error('TENANT_LOAD_FAILED')
    }
    throw error
  }
}

/** @deprecated Use fetchTenant */
export const fetchVdPublicTenant = fetchTenant
