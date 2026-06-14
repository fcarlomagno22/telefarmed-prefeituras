import type {
  MinhaCandidatura,
  MinhaCandidaturaDataCorrection,
  MinhaCandidaturaEditableProfile,
} from '../../../types/minhaCandidatura'

export type EditableProfileField = 'council' | 'email' | 'phone' | 'rqe'

export function inferEditableFields(note: string, profile?: MinhaCandidaturaEditableProfile) {
  const normalized = note.toLowerCase()
  const fields = new Set<EditableProfileField>()

  if (/crm|conselho|crefito|crp|crn|cff|registro/.test(normalized)) fields.add('council')
  if (/e-?mail|email/.test(normalized)) fields.add('email')
  if (/telefone|celular|fone|whatsapp/.test(normalized)) fields.add('phone')
  if (/rqe/.test(normalized)) fields.add('rqe')

  if (fields.size === 0) {
    fields.add('council')
    fields.add('email')
    fields.add('phone')
    if (profile?.rqe) fields.add('rqe')
  }

  return fields
}

export function buildProfileCorrectionPayload(
  note: string,
  profileDraft: MinhaCandidaturaEditableProfile,
  editableProfile?: MinhaCandidaturaEditableProfile,
): MinhaCandidaturaDataCorrection {
  const fields = inferEditableFields(note, editableProfile)
  const dados: MinhaCandidaturaDataCorrection = {}

  if (fields.has('email') && profileDraft.email.trim()) dados.email = profileDraft.email.trim()
  if (fields.has('phone') && profileDraft.phone.trim()) dados.telefone = profileDraft.phone.trim()
  if (fields.has('council') && profileDraft.councilNumber.trim()) {
    dados.conselhoNumero = profileDraft.councilNumber.trim()
  }
  if (fields.has('council') && profileDraft.councilUf.trim()) {
    dados.conselhoUf = profileDraft.councilUf.trim().toUpperCase()
  }
  if (fields.has('rqe')) dados.rqe = profileDraft.rqe?.trim() ?? ''

  return dados
}

export function isProfileCorrectionComplete(
  note: string,
  profileDraft: MinhaCandidaturaEditableProfile,
  editableProfile?: MinhaCandidaturaEditableProfile,
): boolean {
  const fields = inferEditableFields(note, editableProfile)
  if (fields.has('email') && !profileDraft.email.trim()) return false
  if (fields.has('phone') && !profileDraft.phone.trim()) return false
  if (fields.has('council') && !profileDraft.councilNumber.trim()) return false
  if (fields.has('council') && profileDraft.councilUf.trim().length !== 2) return false
  return true
}

export function isCorrectionBatchReady(input: {
  candidatura: MinhaCandidatura
  profileDraft: MinhaCandidaturaEditableProfile | null
  documentDrafts: Record<string, File>
}): boolean {
  const { candidatura, profileDraft, documentDrafts } = input

  if (candidatura.dataCorrectionNote) {
    if (!profileDraft) return false
    if (
      !isProfileCorrectionComplete(
        candidatura.dataCorrectionNote,
        profileDraft,
        candidatura.editableProfile,
      )
    ) {
      return false
    }
  }

  for (const doc of candidatura.documents) {
    if (!documentDrafts[doc.id]) return false
  }

  return candidatura.hasPendingCorrections
}

export function countMissingCorrections(input: {
  candidatura: MinhaCandidatura
  profileDraft: MinhaCandidaturaEditableProfile | null
  documentDrafts: Record<string, File>
}): number {
  let missing = 0
  const { candidatura, profileDraft, documentDrafts } = input

  if (candidatura.dataCorrectionNote) {
    if (
      !profileDraft ||
      !isProfileCorrectionComplete(
        candidatura.dataCorrectionNote,
        profileDraft,
        candidatura.editableProfile,
      )
    ) {
      missing += 1
    }
  }

  for (const doc of candidatura.documents) {
    if (!documentDrafts[doc.id]) missing += 1
  }

  return missing
}
