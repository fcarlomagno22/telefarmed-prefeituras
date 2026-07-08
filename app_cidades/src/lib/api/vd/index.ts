export { VdApiError, vdRequest } from './client'
export {
  buildTenantHeaders,
  getVdTenantScope,
  mergeTenantIntoBody,
  mergeTenantIntoQuery,
  setVdApiTenantScope,
} from './tenantScope'

export { fetchTenant, fetchVdPublicTenant } from './tenant'
export { checkCepEligibility, lookupCpf, register } from './cadastro'
export { fetchMe, login, logout, refresh } from './auth'
export {
  completePasswordRecovery,
  forgotPassword,
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
} from './passwordRecovery'

export type {
  VdCadastroLookupResult,
  VdCepElegibilidadeResult,
  VdLoginResult,
  VdPacienteUser,
  VdPasswordRecoveryRequestResult,
  VdPasswordRecoveryVerifyResult,
  VdRegisterInput,
  VdRegisterResult,
  VdTenantResult,
  VdTenantScope,
} from '../../../types/vdApi'
