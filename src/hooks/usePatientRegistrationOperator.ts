import { useMemo } from 'react'
import { useOptionalAdminAuth } from '../contexts/AdminAuthContext'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import type { PatientRegistrationOperatorContext } from '../utils/patientRegistrationConsent'

export function usePatientRegistrationOperator(
  fallbackUnitName = 'Cadastro administrativo',
): PatientRegistrationOperatorContext {
  const ubtAuth = useOptionalUbtAuth()
  const adminAuth = useOptionalAdminAuth()

  return useMemo(() => {
    if (ubtAuth?.user) {
      return {
        operatorName: ubtAuth.user.nome,
        registrationUnitId: ubtAuth.user.unidadeUbtId,
        registrationUnitName: ubtAuth.user.unidadeUbtNome,
        operatorUserId: ubtAuth.user.id,
      }
    }

    if (adminAuth?.user) {
      return {
        operatorName: adminAuth.user.nome,
        registrationUnitName: fallbackUnitName,
        operatorAdminId: adminAuth.user.id,
      }
    }

    return {
      operatorName: 'Operador',
      registrationUnitName: fallbackUnitName,
    }
  }, [adminAuth?.user, fallbackUnitName, ubtAuth?.user])
}
