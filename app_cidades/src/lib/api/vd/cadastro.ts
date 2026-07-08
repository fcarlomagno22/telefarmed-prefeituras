import type {
  VdCepElegibilidadeResult,
  VdCadastroLookupResult,
  VdRegisterInput,
  VdRegisterResult,
  VdTenantScope,
} from '../../../types/vdApi'
import { vdRequest } from './client'
import { getVdTenantScope, mergeTenantIntoBody } from './tenantScope'

export async function checkCepEligibility(
  input: {
    cep: string
    cidade?: string
    uf?: string
  },
  scope?: VdTenantScope,
): Promise<VdCepElegibilidadeResult> {
  return vdRequest<VdCepElegibilidadeResult>({
    method: 'GET',
    path: '/vd/cadastro/elegibilidade-cep',
    query: {
      cep: input.cep,
      cidade: input.cidade,
      uf: input.uf,
    },
    tenantScope: scope,
    credentials: 'omit',
  })
}

export async function lookupCpf(
  cpf: string,
  scope?: VdTenantScope,
): Promise<VdCadastroLookupResult> {
  return vdRequest<VdCadastroLookupResult>({
    method: 'GET',
    path: '/vd/cadastro/lookup',
    query: { cpf },
    tenantScope: scope,
    credentials: 'omit',
  })
}

export async function register(
  input: VdRegisterInput,
  scope?: VdTenantScope,
): Promise<VdRegisterResult> {
  const tenantScope = scope ?? getVdTenantScope()
  return vdRequest<VdRegisterResult>({
    method: 'POST',
    path: '/vd/cadastro/registrar',
    body: mergeTenantIntoBody(input, tenantScope),
    tenantScope,
    credentials: 'include',
  })
}
