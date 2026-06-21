import type { PatientAgeGroup, PatientRegistration } from '../../types/attendance'
import { isValidCns, cnsDigits } from '../../utils/cns'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { clearLgpdMaskedRegistrationField } from '../../utils/lgpdMaskedValue'
import { isPatientRegistrationConsentReady } from '../../utils/patientRegistrationConsent'
import {
  requiresGuardianValidation,
  resolvedGuardianCpf,
  resolvedGuardianPhone,
  isPatientCnsRequiredForRegistration,
} from '../../utils/patientRegistrationValidation'

export type RegistrationFieldKey =
  | 'fullName'
  | 'cpf'
  | 'birthDate'
  | 'gender'
  | 'nationality'
  | 'raceColor'
  | 'phone'
  | 'email'
  | 'guardianName'
  | 'guardianCpf'
  | 'guardianRelationship'
  | 'guardianPhone'
  | 'guardianAttendanceAuthorized'
  | 'cns'

const REGISTRATION_FIELD_MESSAGES: Record<RegistrationFieldKey, string> = {
  fullName: 'Informe o nome completo.',
  cpf: 'Informe um CPF válido.',
  birthDate: 'Informe a data de nascimento.',
  gender: 'Selecione o gênero.',
  nationality: 'Selecione a nacionalidade.',
  raceColor: 'Selecione a raça/cor.',
  phone: 'Informe o celular do paciente.',
  email: 'Informe o e-mail do paciente.',
  guardianName: 'Informe o nome do responsável.',
  guardianCpf: 'Informe o CPF do responsável.',
  guardianRelationship: 'Informe o grau de parentesco do responsável.',
  guardianPhone: 'Informe o telefone do responsável.',
  guardianAttendanceAuthorized:
    'Confirme a autorização/ciência do responsável pelo atendimento.',
  cns: 'Informe o CNS/Cartão SUS ou marque como pendência.',
}

function isCnsFieldInvalid(data: PatientRegistration, cpfLocked: boolean): boolean {
  if (data.cnsPendente) return false
  const cnsValue = data.cns.trim()
  if (cnsValue && !isValidCns(data.cns)) return true
  return isPatientCnsRequiredForRegistration(data.cpf, cpfLocked) && !isValidCns(data.cns)
}

export function getRegistrationMissingFields(
  data: PatientRegistration,
  ageGroup: PatientAgeGroup,
  cpfLocked: boolean,
): RegistrationFieldKey[] {
  const missing: RegistrationFieldKey[] = []

  if (!data.fullName.trim()) missing.push('fullName')
  if (!cpfLocked && !isValidCpf(data.cpf)) missing.push('cpf')
  if (!data.birthDate) missing.push('birthDate')
  if (!data.gender) missing.push('gender')
  if (!data.nationality) missing.push('nationality')
  if (!data.raceColor) missing.push('raceColor')
  if (clearLgpdMaskedRegistrationField(data.phone).replace(/\D/g, '').length < 10) {
    missing.push('phone')
  }
  if (!clearLgpdMaskedRegistrationField(data.email).trim()) missing.push('email')

  if (isCnsFieldInvalid(data, cpfLocked)) {
    missing.push('cns')
  }

  if (requiresGuardianValidation(ageGroup, data)) {
    if (!data.guardianName.trim()) missing.push('guardianName')
    if (!isValidCpf(resolvedGuardianCpf(data))) missing.push('guardianCpf')
    if (!data.guardianRelationship.trim()) missing.push('guardianRelationship')
    if (resolvedGuardianPhone(data).replace(/\D/g, '').length < 10) {
      missing.push('guardianPhone')
    }
    if (!data.guardianAttendanceAuthorized) missing.push('guardianAttendanceAuthorized')
  }

  return missing
}

export function getRegistrationFieldErrorMessage(
  field: RegistrationFieldKey,
  data: PatientRegistration,
  ageGroup: PatientAgeGroup,
  cpfLocked: boolean,
): string | null {
  const missing = getRegistrationMissingFields(data, ageGroup, cpfLocked)
  if (!missing.includes(field)) return null

  if (field === 'cpf') {
    return cpfDigits(data.cpf).length < 11
      ? 'Informe um CPF completo com 11 dígitos.'
      : 'CPF inválido. Verifique os números digitados.'
  }

  if (field === 'guardianCpf') {
    return cpfDigits(resolvedGuardianCpf(data)).length === 0
      ? 'Informe o CPF do responsável.'
      : 'CPF do responsável inválido.'
  }

  if (field === 'cns' && isCnsFieldInvalid(data, cpfLocked)) {
    if (data.cns.trim() && cnsDigits(data.cns).length < 15) {
      return 'Informe um CNS/Cartão SUS completo com 15 dígitos.'
    }
    if (data.cns.trim()) {
      return 'CNS/Cartão SUS inválido. Verifique os números digitados.'
    }
    return REGISTRATION_FIELD_MESSAGES.cns
  }

  return REGISTRATION_FIELD_MESSAGES[field]
}

export function getRegistrationValidationMessages(
  data: PatientRegistration,
  ageGroup: PatientAgeGroup,
  cpfLocked: boolean,
): string[] {
  const missing = getRegistrationMissingFields(data, ageGroup, cpfLocked)
  const messages = missing
    .map((field) => getRegistrationFieldErrorMessage(field, data, ageGroup, cpfLocked))
    .filter((message): message is string => Boolean(message))

  return [...new Set(messages)]
}

export function isRegistrationStepReady(
  data: PatientRegistration,
  ageGroup: PatientAgeGroup,
  cpfLocked: boolean,
) {
  return getRegistrationMissingFields(data, ageGroup, cpfLocked).length === 0
}

export type AddressFieldKey =
  | 'zipCode'
  | 'street'
  | 'number'
  | 'neighborhood'
  | 'city'
  | 'state'

export function getAddressMissingFields(data: PatientRegistration): AddressFieldKey[] {
  const missing: AddressFieldKey[] = []
  if (clearLgpdMaskedRegistrationField(data.zipCode).replace(/\D/g, '').length !== 8) {
    missing.push('zipCode')
  }
  if (!clearLgpdMaskedRegistrationField(data.street).trim()) missing.push('street')
  if (!clearLgpdMaskedRegistrationField(data.number).trim()) missing.push('number')
  if (!clearLgpdMaskedRegistrationField(data.neighborhood).trim()) {
    missing.push('neighborhood')
  }
  if (!data.city.trim()) missing.push('city')
  if (!data.state.trim()) missing.push('state')
  return missing
}

export function isAddressStepReady(data: PatientRegistration) {
  return getAddressMissingFields(data).length === 0
}

export function isRegistrationConsentStepReady(
  data: PatientRegistration,
  ageGroup: PatientAgeGroup,
  cpfLocked = true,
) {
  return (
    isPatientRegistrationConsentReady(data.registrationConsent) &&
    isRegistrationStepReady(data, ageGroup, cpfLocked)
  )
}
