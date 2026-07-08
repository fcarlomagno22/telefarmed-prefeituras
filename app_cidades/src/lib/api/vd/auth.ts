import type { VdLoginResult, VdPacienteUser, VdTenantScope } from '../../../types/vdApi'
import { vdRequest } from './client'
import { getVdTenantScope, mergeTenantIntoBody } from './tenantScope'

export async function login(
  input: { cpf: string; password: string },
  scope?: VdTenantScope,
): Promise<VdLoginResult> {
  const tenantScope = scope ?? getVdTenantScope()
  return vdRequest<VdLoginResult>({
    method: 'POST',
    path: '/vd/auth/login',
    body: mergeTenantIntoBody(input, tenantScope),
    tenantScope,
    credentials: 'include',
  })
}

export async function refresh(scope?: VdTenantScope): Promise<VdLoginResult> {
  const tenantScope = scope ?? getVdTenantScope()
  return vdRequest<VdLoginResult>({
    method: 'POST',
    path: '/vd/auth/refresh',
    body: mergeTenantIntoBody({}, tenantScope),
    tenantScope,
    credentials: 'include',
  })
}

export async function logout(scope?: VdTenantScope): Promise<void> {
  const tenantScope = scope ?? getVdTenantScope()
  await vdRequest<{ ok: true }>({
    method: 'POST',
    path: '/vd/auth/logout',
    body: mergeTenantIntoBody({}, tenantScope),
    tenantScope,
    credentials: 'include',
  })
}

export async function fetchMe(accessToken: string, scope?: VdTenantScope): Promise<VdPacienteUser> {
  const result = await vdRequest<{ user: VdPacienteUser }>({
    method: 'GET',
    path: '/vd/auth/me',
    accessToken,
    tenantScope: scope,
    credentials: 'include',
  })
  return result.user
}
