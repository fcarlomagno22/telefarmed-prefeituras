import type { PatientAgeGroup } from '../types/attendance'
import { cpfDigits, isValidCpf } from './cpf'
import { clearLgpdMaskedRegistrationField } from './lgpdMaskedValue'

/** CNS só é exigido no cadastro quando o paciente não possui CPF válido. */
export function isPatientCnsRequiredForRegistration(cpf: string, cpfLocked = false): boolean {
  if (cpfLocked) return false
  return !isValidCpf(cpf)
}

/** Espelha a regra do backend: responsável exigido para menor ou quando há dados parciais. */
export function requiresGuardianValidation(
  ageGroup: PatientAgeGroup,
  data: {
    guardianName: string
    guardianCpf: string
  },
): boolean {
  if (ageGroup === 'minor') return true

  const guardianName = data.guardianName.trim()
  const guardianCpfDigits = cpfDigits(
    clearLgpdMaskedRegistrationField(data.guardianCpf),
  ).length

  return Boolean(guardianName || guardianCpfDigits > 0)
}

export function resolvedGuardianCpf(data: { guardianCpf: string }) {
  return clearLgpdMaskedRegistrationField(data.guardianCpf)
}

export function resolvedGuardianPhone(data: { guardianPhone: string }) {
  return clearLgpdMaskedRegistrationField(data.guardianPhone)
}
