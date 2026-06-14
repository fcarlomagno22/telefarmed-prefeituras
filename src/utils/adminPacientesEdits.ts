import type { UserProfileEdits } from '../data/networkUserLocalData'
import type { UpdatePacientePayload } from '../lib/services/admin/pacientes'
import { birthDateDisplayToIso } from '../components/admin/pacientes/preRegistration/adminPatientRegistrationMapper'

export type PacienteEditsDetailSource = {
  birthDate: string
  profile?: {
    genderLabel?: string
  }
}

function cleanField(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '—') return undefined
  return trimmed
}

export function userEditsToUpdatePayload(
  detail: PacienteEditsDetailSource,
  edits: UserProfileEdits,
): UpdatePacientePayload {
  const profile = detail.profile

  return {
    phone: cleanField(edits.phone),
    email: cleanField(edits.email),
    guardianName: cleanField(edits.guardianName),
    guardianCpf: cleanField(edits.guardianCpf),
    zipCode: cleanField(edits.zipCode),
    street: cleanField(edits.street),
    number: cleanField(edits.number),
    complement: edits.complement?.trim() || undefined,
    neighborhood: cleanField(edits.neighborhood),
    city: cleanField(edits.city),
    state: cleanField(edits.state),
    gender: profile?.genderLabel,
    birthDate: detail.birthDate.includes('/')
      ? birthDateDisplayToIso(detail.birthDate)
      : detail.birthDate,
    contacts: edits.contacts
      .filter((contact) => contact.name.trim() || contact.phone.trim())
      .map((contact) => ({
        id: contact.id,
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        relationship: contact.relationship?.trim() || undefined,
      })),
  }
}
