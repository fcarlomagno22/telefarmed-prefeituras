import type { PatientAgeGroup, PatientRegistration } from '../../types/attendance'
import { isValidCpf } from '../../utils/cpf'

export type RegistrationFieldKey =
  | 'fullName'
  | 'cpf'
  | 'birthDate'
  | 'gender'
  | 'phone'
  | 'email'
  | 'guardianName'
  | 'guardianCpf'

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
  if (data.phone.replace(/\D/g, '').length < 10) missing.push('phone')
  if (!data.email.trim()) missing.push('email')

  if (ageGroup === 'minor') {
    if (!data.guardianName.trim()) missing.push('guardianName')
    if (!isValidCpf(data.guardianCpf)) missing.push('guardianCpf')
  }

  if (ageGroup === 'elderly' && data.guardianCpf.trim() && !isValidCpf(data.guardianCpf)) {
    missing.push('guardianCpf')
  }

  return missing
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
  if (data.zipCode.replace(/\D/g, '').length !== 8) missing.push('zipCode')
  if (!data.street.trim()) missing.push('street')
  if (!data.number.trim()) missing.push('number')
  if (!data.neighborhood.trim()) missing.push('neighborhood')
  if (!data.city.trim()) missing.push('city')
  if (!data.state.trim()) missing.push('state')
  return missing
}

export function isAddressStepReady(data: PatientRegistration) {
  return getAddressMissingFields(data).length === 0
}
