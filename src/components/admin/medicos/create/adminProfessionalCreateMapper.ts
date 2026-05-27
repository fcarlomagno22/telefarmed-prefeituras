import {
  createEmptyAdminDoctor,
  type AdminDoctor,
} from '../../../../data/adminMedicosMock'
import {
  getCouncilLabel,
  type AdminProfessionalCreateDraft,
} from './adminProfessionalCreateTypes'

function formatCouncilRegistration(
  profession: AdminProfessionalCreateDraft['profession'],
  councilNumber: string,
) {
  const prefix = getCouncilLabel(profession)
  const digits = councilNumber.replace(/\D/g, '')
  if (!digits) return ''
  return `${prefix} ${digits}`
}

export function draftToAdminDoctor(draft: AdminProfessionalCreateDraft): AdminDoctor {
  const base = createEmptyAdminDoctor()

  return {
    ...base,
    id: `prof-${Date.now()}`,
    name: draft.fullName.trim(),
    profession: draft.profession,
    specialty: draft.specialty.trim(),
    crm: formatCouncilRegistration(draft.profession, draft.councilNumber),
    ufCrm: draft.councilUf.trim().toUpperCase(),
    zipCode: draft.zipCode.trim(),
    street: draft.street.trim(),
    number: draft.number.trim(),
    complement: draft.complement.trim(),
    neighborhood: draft.neighborhood.trim(),
    city: draft.city.trim(),
    state: draft.state.trim().toUpperCase(),
    avatarUrl:
      draft.photoDataUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(draft.fullName.trim() || 'Profissional')}&background=ff6b00&color=fff`,
    onCallLabel: 'Aguardando escala',
    status: 'ativo',
  }
}
