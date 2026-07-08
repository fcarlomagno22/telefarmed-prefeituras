import { buildConsentimentoCadastroFromAppRegistration } from '../../lib/patientRegistrationAppConsent.js'
import { normalizeCepDigits } from '../../lib/viacep.js'
import type { CreatePacienteInput } from '../admin-pacientes/types.js'
import { APP_PACIENTE_REGISTRATION_DEFAULTS } from './registration.constants.js'
import type { AppPacienteRegistrationInput } from './registration.schema.js'

export type AppPacienteRegistrationMapped = {
  paciente: CreatePacienteInput
  password: string
}

export type MapAppPacienteRegistrationContext = {
  entidadeContratanteId: string
  entityDisplayName: string
}

function resolvePhotoDataUrl(input: AppPacienteRegistrationInput): string | undefined {
  return input.photoDataUrl?.trim() || input.selfie?.trim() || undefined
}

export function mapAppPacienteRegistrationToCreatePacienteInput(
  input: AppPacienteRegistrationInput,
  context: MapAppPacienteRegistrationContext,
): AppPacienteRegistrationMapped {
  const consentimentoCadastro = buildConsentimentoCadastroFromAppRegistration({
    acceptances: input.registrationConsent,
    context: {
      patientName: input.fullName,
      entityDisplayName: context.entityDisplayName,
      entidadeId: context.entidadeContratanteId,
    },
  })

  return {
    password: input.password,
    paciente: {
      entidadeContratanteId: context.entidadeContratanteId,
      fullName: input.fullName,
      cpf: input.cpf,
      email: input.email,
      phone: input.phone,
      zipCode: normalizeCepDigits(input.address.cep),
      street: input.address.logradouro,
      number: input.address.numero,
      complement: input.address.complemento,
      neighborhood: input.address.bairro,
      city: input.address.cidade,
      state: input.address.uf,
      residenceMunicipalityIbgeCode: input.address.codigoIbgeMunicipio,
      photoDataUrl: resolvePhotoDataUrl(input),
      gender: APP_PACIENTE_REGISTRATION_DEFAULTS.gender,
      cnsPendente: APP_PACIENTE_REGISTRATION_DEFAULTS.cnsPendente,
      status: APP_PACIENTE_REGISTRATION_DEFAULTS.status,
      cadastroOrigem: APP_PACIENTE_REGISTRATION_DEFAULTS.cadastroOrigem,
      consentimentoCadastro,
    },
  }
}
