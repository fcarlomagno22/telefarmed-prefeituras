import type {
  PatientNationality,
  PatientRaceColor,
} from '../utils/patientRegistrationOptions'
import type { PatientRegistrationConsent } from '../utils/patientRegistrationConsent'

export type { PatientRegistrationConsent } from '../utils/patientRegistrationConsent'

export type StationStatus =
  | 'idle'
  | 'specialty'
  | 'age_group'
  | 'cpf_lookup'
  | 'confirm_registration'
  | 'registration'
  | 'contacts'
  | 'address'
  | 'photo'
  | 'registration_consent'
  | 'clinical_triage'
  | 'waiting_room'
  | 'waiting_doctor'
  | 'in_consultation'

export type PatientAgeGroup = 'adult' | 'minor' | 'elderly'

export type PatientContact = {
  id: string
  name: string
  phone: string
  relationship: string
}

export function createPatientContactId() {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const emptyPatientContact = (): PatientContact => ({
  id: createPatientContactId(),
  name: '',
  phone: '',
  relationship: '',
})

export type PatientRegistration = {
  fullName: string
  /** Nome pelo qual o paciente prefere ser chamado (opcional). */
  socialName: string
  cpf: string
  birthDate: string
  gender: string
  nationality: PatientNationality | ''
  raceColor: PatientRaceColor | ''
  phone: string
  email: string
  guardianName: string
  guardianCpf: string
  guardianRelationship: string
  guardianPhone: string
  guardianAttendanceAuthorized: boolean
  cns: string
  cnsPendente: boolean
  contacts: PatientContact[]
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  residenceMunicipalityIbgeCode: string
  photoDataUrl: string
  registrationConsent: PatientRegistrationConsent | null
}

export const emptyPatientRegistration = (): PatientRegistration => ({
  fullName: '',
  socialName: '',
  cpf: '',
  birthDate: '',
  gender: '',
  nationality: '',
  raceColor: '',
  phone: '',
  email: '',
  guardianName: '',
  guardianCpf: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianAttendanceAuthorized: false,
  cns: '',
  cnsPendente: false,
  contacts: [emptyPatientContact()],
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  residenceMunicipalityIbgeCode: '',
  photoDataUrl: '',
  registrationConsent: null,
})

export type AttendanceSession = {
  specialtyId: string
  specialtyName: string
  ageGroup: PatientAgeGroup | null
}

export const emptyAttendanceSession = (): AttendanceSession => ({
  specialtyId: '',
  specialtyName: '',
  ageGroup: null,
})

export type RegisteredPatient = {
  name: string
  document: string
  specialty: string
  protocol: string
  scheduledAt: string
}

/** Nome de tratamento: nome social, se informado; caso contrário, nome civil. */
export function getPatientPreferredName(
  data: Pick<PatientRegistration, 'fullName' | 'socialName'>,
) {
  const social = data.socialName?.trim() ?? ''
  const fullName = data.fullName?.trim() ?? ''
  return social || fullName
}

/** Garante campos string/contatos mesmo quando o cadastro veio parcial da API. */
export function normalizePatientRegistration(
  data: Partial<PatientRegistration> & { cpf: string },
): PatientRegistration {
  const base = emptyPatientRegistration()
  const contacts =
    Array.isArray(data.contacts) && data.contacts.length > 0
      ? data.contacts.map((contact) => ({ ...contact }))
      : base.contacts

  return {
    ...base,
    ...data,
    cpf: data.cpf,
    fullName: data.fullName ?? '',
    socialName: data.socialName ?? '',
    birthDate: data.birthDate ?? '',
    gender: data.gender ?? '',
    nationality: data.nationality ?? '',
    raceColor: data.raceColor ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    guardianName: data.guardianName ?? '',
    guardianCpf: data.guardianCpf ?? '',
    guardianRelationship: data.guardianRelationship ?? '',
    guardianPhone: data.guardianPhone ?? '',
    guardianAttendanceAuthorized: data.guardianAttendanceAuthorized ?? false,
    cns: data.cns ?? '',
    cnsPendente: data.cnsPendente ?? false,
    zipCode: data.zipCode ?? '',
    street: data.street ?? '',
    number: data.number ?? '',
    complement: data.complement ?? '',
    neighborhood: data.neighborhood ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
    residenceMunicipalityIbgeCode: data.residenceMunicipalityIbgeCode ?? '',
    photoDataUrl: data.photoDataUrl ?? '',
    registrationConsent: data.registrationConsent ?? null,
    contacts,
  }
}

export function registrationToPatient(
  data: PatientRegistration,
  specialtyName: string,
): RegisteredPatient {
  const digits = data.cpf.replace(/\D/g, '')
  const maskedCpf =
    digits.length >= 11
      ? `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
      : data.cpf

  return {
    name: getPatientPreferredName(data),
    document: maskedCpf,
    specialty: specialtyName,
    protocol: `ATD-${Date.now().toString().slice(-6)}`,
    scheduledAt: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()),
  }
}

export const ageGroupLabels: Record<PatientAgeGroup, string> = {
  adult: 'Maior de idade',
  minor: 'Menor de idade',
  elderly: 'Da melhor idade',
}

export function inferAgeGroupFromBirthDate(birthDate: string): PatientAgeGroup {
  if (!birthDate) return 'adult'
  const parsed = new Date(`${birthDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'adult'

  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }

  if (age < 18) return 'minor'
  if (age >= 60) return 'elderly'
  return 'adult'
}

export const unitGuideSteps = [
  {
    step: 1,
    title: 'Escolha a especialidade',
    description: 'Selecione a área médica do atendimento.',
  },
  {
    step: 2,
    title: 'Identifique o paciente',
    description: 'Informe o CPF e a faixa etária para localizar ou cadastrar o paciente.',
  },
  {
    step: 3,
    title: 'Triagem clínica',
    description: 'Registre motivo, sintomas e informações de saúde para o médico.',
  },
  {
    step: 4,
    title: 'Entre na videochamada',
    description: 'O paciente usa este equipamento para falar com o médico.',
  },
  {
    step: 5,
    title: 'Finalize e libere o Terminal',
    description: 'Encerre a consulta para atender o próximo paciente.',
  },
]
