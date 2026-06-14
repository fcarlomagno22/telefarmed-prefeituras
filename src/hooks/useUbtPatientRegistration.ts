import { useCallback } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import type { PatientRegistration } from '../types/attendance'
import type { PatientLookupContext, PatientLookupResult } from '../types/patientLookup'
import {
  createUbtPacienteApi,
  isUbtPacientesApiError,
  lookupUbtPatientForTriage,
  registerUbtCompletedPatient,
} from '../lib/services/ubt/pacientes'

export function useUbtPatientRegistration() {
  const { getAccessToken } = useUbtAuth()

  const lookupByCpf = useCallback(
    async (cpf: string, context?: PatientLookupContext): Promise<PatientLookupResult> => {
      const token = getAccessToken()
      if (!token) {
        throw new UbtPatientRegistrationError('Sessão UBT expirada. Faça login novamente.')
      }
      return lookupUbtPatientForTriage(token, cpf, context)
    },
    [getAccessToken],
  )

  const registerCompletedPatient = useCallback(
    async (registration: PatientRegistration, existingPatientId?: string) => {
      const token = getAccessToken()
      if (!token) {
        throw new UbtPatientRegistrationError('Sessão UBT expirada. Faça login novamente.')
      }
      return registerUbtCompletedPatient(token, registration, existingPatientId)
    },
    [getAccessToken],
  )

  const createPatient = useCallback(
    async (registration: PatientRegistration) => {
      const token = getAccessToken()
      if (!token) {
        throw new UbtPatientRegistrationError('Sessão UBT expirada. Faça login novamente.')
      }
      return createUbtPacienteApi(token, registration)
    },
    [getAccessToken],
  )

  return {
    lookupByCpf,
    registerCompletedPatient,
    createPatient,
  }
}

export class UbtPatientRegistrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UbtPatientRegistrationError'
  }
}

export function isUbtPatientRegistrationError(error: unknown): error is UbtPatientRegistrationError {
  return error instanceof UbtPatientRegistrationError || isUbtPacientesApiError(error)
}
