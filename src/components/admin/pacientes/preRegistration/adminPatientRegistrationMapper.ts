import type {
  AdminContractStatus,
  AdminMunicipalPatient,
  AdminPatientContractingEntity,
} from '../../../../types/adminPacientes'
import type {
  PreCadastroRegistrationPayload,
  UpdatePacientePayload,
} from '../../../../lib/services/admin/pacientes'
import type { PatientRegistration } from '../../../../types/attendance'
import { cpfDigits } from '../../../../utils/cpf'
import { onlyDigits } from '../../../../utils/lgpdDisplay'

const avatarPalette = [
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
] as const

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function birthDateIsoToDisplay(iso: string) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}

export function birthDateDisplayToIso(display: string) {
  const parts = display.trim().split('/')
  if (parts.length !== 3) return display
  const [day, month, year] = parts
  if (!day || !month || !year) return display
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function ageFromBirthDateIso(iso: string) {
  if (!iso) return 0
  const parsed = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return 0

  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }
  return Math.max(age, 0)
}

function missingFieldsForRegistration(registration: PatientRegistration) {
  const missing: string[] = []
  if (registration.cnsPendente || !registration.cns?.trim()) missing.push('CNS')
  if (!registration.nationality) missing.push('nacionalidade')
  if (!registration.raceColor) missing.push('raça/cor')
  if (!registration.phone?.trim()) missing.push('telefone')
  if (!registration.email?.trim()) missing.push('e-mail')
  if (
    !Array.isArray(registration.contacts) ||
    !registration.contacts.some((contact) => contact.name.trim() && contact.phone.trim())
  ) {
    missing.push('contato de emergência')
  }
  if (!registration.zipCode?.trim()) missing.push('CEP')
  return missing
}

export function adminPatientToRegistration(patient: AdminMunicipalPatient): PatientRegistration {
  return {
    fullName: patient.name,
    socialName: '',
    cpf: patient.cpf,
    birthDate: birthDateDisplayToIso(patient.birthDate),
    gender: 'nao_informado',
    phone: patient.phone,
    email: '',
  guardianName: '',
  guardianCpf: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianAttendanceAuthorized: false,
  nationality: '',
  raceColor: '',
  cns: '',
    cnsPendente: false,
    contacts: [{ id: `contact-${patient.id}`, name: '', phone: '', relationship: '' }],
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: patient.bairro,
    city: patient.municipality,
    state: '',
    photoDataUrl: patient.avatarUrl ?? '',
  }
}

export function findAdminPatientByCpf(
  patients: AdminMunicipalPatient[],
  cpf: string,
): AdminMunicipalPatient | undefined {
  const digits = cpfDigits(cpf)
  if (!digits) return undefined
  return patients.find((patient) => onlyDigits(patient.cpf) === digits)
}

export function registrationToAdminMunicipalPatient(
  registration: PatientRegistration,
  options: {
    contractingEntity: AdminPatientContractingEntity
    existingPatient?: AdminMunicipalPatient | null
  },
): AdminMunicipalPatient {
  const { contractingEntity, existingPatient } = options
  const municipality = contractingEntity.municipality
  const contractStatus: AdminContractStatus = contractingEntity.contractStatus
  const displayName = registration.fullName.trim() || registration.socialName.trim() || 'Paciente'
  const birthDateIso = registration.birthDate.includes('/')
    ? birthDateDisplayToIso(registration.birthDate)
    : registration.birthDate
  const missingFields = missingFieldsForRegistration(registration)
  const id = existingPatient?.id ?? `admin-patient-${Date.now()}`
  const paletteIndex = Number(onlyDigits(id).slice(-1) || '0') % avatarPalette.length

  return {
    id,
    name: displayName,
    initials: initialsFromName(displayName),
    avatarUrl: registration.photoDataUrl || existingPatient?.avatarUrl,
    avatarClassName: existingPatient?.avatarClassName ?? avatarPalette[paletteIndex],
    bairro: registration.neighborhood.trim() || existingPatient?.bairro || '—',
    phone: registration.phone,
    cpf: registration.cpf,
    birthDate: birthDateIsoToDisplay(birthDateIso),
    age: ageFromBirthDateIso(birthDateIso),
    lastAppointmentDate: existingPatient?.lastAppointmentDate ?? '—',
    lastAppointmentRelative: existingPatient?.lastAppointmentRelative ?? 'Sem consultas',
    totalAppointments: existingPatient?.totalAppointments ?? 0,
    municipalRecordId: existingPatient?.municipalRecordId ?? `MUN-${id.replace(/\D/g, '').slice(-6).padStart(6, '0')}`,
    firstAttendanceUnit: existingPatient?.firstAttendanceUnit ?? 'Pré-cadastro administrativo',
    registeredAt:
      existingPatient?.registeredAt ??
      new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date()),
    monthsWithoutConsultation: existingPatient?.monthsWithoutConsultation ?? null,
    dataQuality: missingFields.length > 0 ? 'incomplete' : 'complete',
    missingFields,
    municipality,
    contractStatus,
    contractingEntityId: contractingEntity.id,
    contractingEntityRazaoSocial: contractingEntity.razaoSocial,
    registrationMonthLabel:
      existingPatient?.registrationMonthLabel ?? currentRegistrationMonthLabel(),
  }
}

function currentRegistrationMonthLabel(): AdminMunicipalPatient['registrationMonthLabel'] {
  const month = new Date().getMonth()
  if (month === 11) return 'Dez'
  const labels: AdminMunicipalPatient['registrationMonthLabel'][] = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
  ]
  return labels[month] ?? 'Mai'
}

function mapRegistrationConsentPayload(
  registration: PatientRegistration,
): PreCadastroRegistrationPayload['registrationConsent'] {
  if (!registration.registrationConsent) return undefined
  return {
    dataReviewed: true,
    teleconsultationAuthorized: true,
    dataUsageAcknowledged: true,
    notificationsAllowed: true,
    operatorName: registration.registrationConsent.operatorName,
    registeredAt: registration.registrationConsent.registeredAt,
    registrationUnitId: registration.registrationConsent.registrationUnitId || undefined,
    registrationUnitName: registration.registrationConsent.registrationUnitName,
    operatorUserId: registration.registrationConsent.operatorUserId,
    operatorAdminId: registration.registrationConsent.operatorAdminId,
  }
}

function mapRegistrationCoreFields(registration: PatientRegistration) {
  return {
    nationality: registration.nationality,
    raceColor: registration.raceColor,
    guardianRelationship: registration.guardianRelationship.trim() || undefined,
    guardianPhone: registration.guardianPhone.trim() || undefined,
    guardianAttendanceAuthorized: registration.guardianAttendanceAuthorized || undefined,
    residenceMunicipalityIbgeCode: registration.residenceMunicipalityIbgeCode.trim() || undefined,
    registrationConsent: mapRegistrationConsentPayload(registration),
  }
}

export function registrationToPreCadastroPayload(
  registration: PatientRegistration,
  contractingEntity: AdminPatientContractingEntity,
): PreCadastroRegistrationPayload {
  const birthDateIso = registration.birthDate.includes('/')
    ? birthDateDisplayToIso(registration.birthDate)
    : registration.birthDate

  return {
    entidadeContratanteId: contractingEntity.id,
    fullName: registration.fullName.trim() || registration.socialName.trim() || 'Paciente',
    socialName: registration.socialName.trim() || undefined,
    cpf: registration.cpf,
    birthDate: birthDateIso,
    gender: registration.gender,
    ...mapRegistrationCoreFields(registration),
    phone: registration.phone.trim() || undefined,
    email: registration.email.trim() || undefined,
    guardianName: registration.guardianName.trim() || undefined,
    guardianCpf: registration.guardianCpf.trim() || undefined,
    cns: registration.cns.trim() || undefined,
    cnsPendente: registration.cnsPendente,
    contacts: registration.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    })),
    zipCode: registration.zipCode.trim() || undefined,
    street: registration.street.trim() || undefined,
    number: registration.number.trim() || undefined,
    complement: registration.complement.trim() || undefined,
    neighborhood: registration.neighborhood.trim() || undefined,
    city: registration.city.trim() || undefined,
    state: registration.state.trim() || undefined,
    photoDataUrl: registration.photoDataUrl.trim() || undefined,
  }
}

export function registrationToUpdatePayload(
  registration: PatientRegistration,
): UpdatePacientePayload {
  const birthDateIso = registration.birthDate.includes('/')
    ? birthDateDisplayToIso(registration.birthDate)
    : registration.birthDate

  return {
    fullName: registration.fullName.trim() || registration.socialName.trim() || undefined,
    socialName: registration.socialName.trim() || undefined,
    birthDate: birthDateIso,
    gender: registration.gender,
    ...mapRegistrationCoreFields(registration),
    phone: registration.phone.trim() || undefined,
    email: registration.email.trim() || undefined,
    guardianName: registration.guardianName.trim() || undefined,
    guardianCpf: registration.guardianCpf.trim() || undefined,
    cns: registration.cns.trim() || undefined,
    cnsPendente: registration.cnsPendente,
    contacts: registration.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    })),
    zipCode: registration.zipCode.trim() || undefined,
    street: registration.street.trim() || undefined,
    number: registration.number.trim() || undefined,
    complement: registration.complement.trim() || undefined,
    neighborhood: registration.neighborhood.trim() || undefined,
    city: registration.city.trim() || undefined,
    state: registration.state.trim() || undefined,
    photoDataUrl: registration.photoDataUrl.trim() || undefined,
  }
}
