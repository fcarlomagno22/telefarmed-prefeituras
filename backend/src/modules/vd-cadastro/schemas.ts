export { elegibilidadeCepQuerySchema } from './elegibilidade.schema.js'
export { lookupCpfQuerySchema } from './lookup.schema.js'
export { registrarBodySchema } from './registrar.schema.js'
export {
  appPacienteRegistrationAddressSchema,
  appPacienteRegistrationConsentSchema,
  appPacienteRegistrationObjectSchema,
  appPacienteRegistrationSchema,
  formatAppPacienteRegistrationValidationError,
  type AppPacienteRegistrationAddressInput,
  type AppPacienteRegistrationInput,
} from './registration.schema.js'
export { APP_PACIENTE_REGISTRATION_DEFAULTS } from './registration.constants.js'
export {
  appRegistrationConsentSchema,
  type AppRegistrationConsent,
} from '../../lib/patientRegistrationAppConsent.js'
export {
  mapAppPacienteRegistrationToCreatePacienteInput,
  type AppPacienteRegistrationMapped,
  type MapAppPacienteRegistrationContext,
} from './registration.mapper.js'
