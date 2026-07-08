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
export { getMetricsProfile, updateMetricsProfile, getLatestWeight, getMetricsResumo, listActivityHistory, listBodyMeasurements, listHealthIntegrations, listHeartRateHistory, listHydrationHistory, listBloodPressureHistory, listGlucoseHistory, listWeightHistory, registerBodyMeasurement, registerHeartRate, registerHydration, registerBloodPressure, registerGlucose, registerWalk, registerWeight, syncActivityDaysBatch, updateHealthIntegration } from './metricas'
export {
  completePasswordRecovery,
  forgotPassword,
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
} from './passwordRecovery'

export type {
  AtividadeDayRecordDto,
  BloodPressureHistoryEntryDto,
  BodyMeasurementsHistoryDto,
  GlucoseHistoryEntryDto,
  HeartRateHistoryEntryDto,
  HydrationDayRecordDto,
  IntegracaoMetricasDto,
  LatestWeightResult,
  MetricDataPointDto,
  MetricsProfileDto,
  MetricsResumoDto,
  MetricsResumoLatestDto,
  RegisterBloodPressureResult,
  RegisterBodyMeasurementResult,
  RegisterGlucoseResult,
  RegisterHeartRateResult,
  RegisterHydrationResult,
  RegisterWalkResult,
  RegisterWeightResult,
  SyncActivityDaysBatchResult,
  UpdateHealthIntegrationInput,
  UpdateHealthIntegrationResult,
  UpdateMetricsProfileInput,
} from './metricas'
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
