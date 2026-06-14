import type { UserProfileEdits } from '../data/networkUserLocalData'
import type { UbtPacienteRegistrationDetail } from '../lib/mockServices/ubt/pacientes'
import { mapUbtDetailToPatientRegistration } from '../lib/mockServices/ubt/pacientes'
import { normalizePatientRegistration, type PatientRegistration } from '../types/attendance'

function cleanOptionalField(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed === '—' ? '' : trimmed
}

export function mergeDrawerEditsIntoRegistration(
  detail: UbtPacienteRegistrationDetail,
  edits: UserProfileEdits,
): PatientRegistration {
  const base = mapUbtDetailToPatientRegistration(detail)

  return normalizePatientRegistration({
    ...base,
    phone: edits.phone.trim() || base.phone,
    email: cleanOptionalField(edits.email) || base.email,
    zipCode: cleanOptionalField(edits.zipCode) || base.zipCode,
    street: cleanOptionalField(edits.street) || base.street,
    number: cleanOptionalField(edits.number) || base.number,
    complement: edits.complement.trim() || base.complement,
    neighborhood: cleanOptionalField(edits.neighborhood) || base.neighborhood,
    city: cleanOptionalField(edits.city) || base.city,
    state: cleanOptionalField(edits.state) || base.state,
    guardianName: edits.guardianName.trim() || base.guardianName,
    guardianCpf: edits.guardianCpf.trim() || base.guardianCpf,
    contacts: edits.contacts,
  })
}
