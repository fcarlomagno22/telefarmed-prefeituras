import type {
  VdPasswordRecoveryRequestResult,
  VdPasswordRecoveryVerifyResult,
  VdTenantScope,
} from '../../../types/vdApi'
import { vdRequest } from './client'
import { getVdTenantScope, mergeTenantIntoBody } from './tenantScope'

export async function requestPasswordRecovery(
  cpf: string,
  scope?: VdTenantScope,
): Promise<VdPasswordRecoveryRequestResult> {
  const tenantScope = scope ?? getVdTenantScope()
  return vdRequest<VdPasswordRecoveryRequestResult>({
    method: 'POST',
    path: '/vd/auth/recuperacao-senha/solicitar',
    body: mergeTenantIntoBody({ cpf }, tenantScope),
    tenantScope,
    credentials: 'omit',
  })
}

export async function verifyPasswordRecoveryCode(
  input: { resetToken: string; code: string },
  scope?: VdTenantScope,
): Promise<VdPasswordRecoveryVerifyResult> {
  return vdRequest<VdPasswordRecoveryVerifyResult>({
    method: 'POST',
    path: '/vd/auth/recuperacao-senha/verificar-codigo',
    body: input,
    tenantScope: scope,
    credentials: 'omit',
  })
}

export async function completePasswordRecovery(
  input: { verificationToken: string; password: string },
  scope?: VdTenantScope,
): Promise<void> {
  await vdRequest<{ ok: true }>({
    method: 'POST',
    path: '/vd/auth/recuperacao-senha/concluir',
    body: input,
    tenantScope: scope,
    credentials: 'omit',
  })
}

/** Fluxo de recuperação de senha (3 etapas). */
export const forgotPassword = {
  request: requestPasswordRecovery,
  verify: verifyPasswordRecoveryCode,
  complete: completePasswordRecovery,
}
