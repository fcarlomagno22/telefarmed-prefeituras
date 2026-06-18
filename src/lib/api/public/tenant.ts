import { API_BASE_URL } from '../config'
import type { PublicTenantResponse } from '../../types/tenantHost'

export async function fetchPublicTenant(input?: {
  host?: string
  slug?: string
}): Promise<PublicTenantResponse> {
  const params = new URLSearchParams()
  if (input?.slug) params.set('slug', input.slug)
  if (input?.host) params.set('host', input.host)

  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE_URL}/public/tenant${suffix}`, {
    method: 'GET',
    credentials: 'omit',
    redirect: 'manual',
  })

  if (response.status === 301 || response.status === 302) {
    const location = response.headers.get('Location')
    if (location && typeof window !== 'undefined') {
      window.location.replace(location)
      throw new Error('TENANT_REDIRECT')
    }
  }

  if (response.status === 404) {
    throw new Error('TENANT_NOT_FOUND')
  }

  if (!response.ok) {
    throw new Error('TENANT_LOAD_FAILED')
  }

  return (await response.json()) as PublicTenantResponse
}
