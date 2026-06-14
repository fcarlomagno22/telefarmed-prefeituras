import type { AdminDoctor } from '../../../../types/adminMedicos'
import {
  getCouncilLabel,
  type AdminProfessionalCreateDraft,
} from './adminProfessionalCreateTypes'

const formationByProfession: Record<
  AdminProfessionalCreateDraft['profession'],
  'medicina' | 'psicologia' | 'nutricao' | 'fonoaudiologia'
> = {
  Médicos: 'medicina',
  Psicólogos: 'psicologia',
  Nutricionistas: 'nutricao',
  Fonoaudiólogos: 'fonoaudiologia',
}

function formatCouncilRegistration(
  profession: AdminProfessionalCreateDraft['profession'],
  councilNumber: string,
) {
  const prefix = getCouncilLabel(profession)
  const digits = councilNumber.replace(/\D/g, '')
  if (!digits) return ''
  return `${prefix} ${digits}`
}

export function draftToCreateAtivoPayload(draft: AdminProfessionalCreateDraft) {
  return {
    fullName: draft.fullName.trim(),
    cpf: draft.cpf.trim(),
    email: draft.email.trim(),
    password: draft.password,
    phone: draft.phone.trim() || undefined,
    formation: formationByProfession[draft.profession],
    specialty: draft.specialty.trim(),
    councilNumber: draft.councilNumber.replace(/\D/g, '') || draft.councilNumber.trim(),
    councilUf: draft.councilUf.trim().toUpperCase(),
    street: draft.street.trim(),
    number: draft.number.trim(),
    complement: draft.complement.trim() || undefined,
    neighborhood: draft.neighborhood.trim(),
    city: draft.city.trim(),
    state: draft.state.trim().toUpperCase(),
    zipCode: draft.zipCode.trim(),
  }
}

export function draftToAdminDoctorPreview(draft: AdminProfessionalCreateDraft): AdminDoctor {
  const name = draft.fullName.trim()

  return {
    id: 'preview',
    name,
    phone: draft.phone.trim(),
    cpf: draft.cpf.trim(),
    rg: '',
    crm: formatCouncilRegistration(draft.profession, draft.councilNumber),
    ufCrm: draft.councilUf.trim().toUpperCase(),
    profession: draft.profession,
    specialty: draft.specialty.trim(),
    avatarUrl:
      draft.photoDataUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Profissional')}&background=ff6b00&color=fff`,
    zipCode: draft.zipCode.trim(),
    street: draft.street.trim(),
    number: draft.number.trim(),
    complement: draft.complement.trim(),
    neighborhood: draft.neighborhood.trim(),
    city: draft.city.trim(),
    state: draft.state.trim().toUpperCase(),
    allocation: 'nacional',
    contractingEntity: null,
    onCallLabel: 'Aguardando escala',
    status: 'ativo',
    isOnlineNow: false,
    totalPatientsThisMonth: 0,
    averageRating: 0,
    totalReviews: 0,
    lastLoginAt: '—',
    lastLogoutAt: null,
    documents: [],
    attendances: [],
    reviews: [],
  }
}
