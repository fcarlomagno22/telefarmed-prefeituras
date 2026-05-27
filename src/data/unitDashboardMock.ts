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
  phone: string
  email: string
  guardianName: string
  guardianCpf: string
  contacts: PatientContact[]
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  photoDataUrl: string
}

export const emptyPatientRegistration = (): PatientRegistration => ({
  fullName: '',
  socialName: '',
  cpf: '',
  birthDate: '',
  gender: '',
  phone: '',
  email: '',
  guardianName: '',
  guardianCpf: '',
  contacts: [emptyPatientContact()],
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  photoDataUrl: '',
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

export const unitStation = {
  unitName: 'UBT Centro — Sala de Teleatendimento',
  stationLabel: 'Computador 01',
}

/** Nome de tratamento: nome social, se informado; caso contrário, nome civil. */
export function getPatientPreferredName(
  data: Pick<PatientRegistration, 'fullName' | 'socialName'>,
) {
  const social = data.socialName?.trim() ?? ''
  const fullName = data.fullName?.trim() ?? ''
  return social || fullName
}

/** Garante campos string/contatos mesmo quando o cadastro veio parcial (ex.: localStorage). */
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
    phone: data.phone ?? '',
    email: data.email ?? '',
    guardianName: data.guardianName ?? '',
    guardianCpf: data.guardianCpf ?? '',
    zipCode: data.zipCode ?? '',
    street: data.street ?? '',
    number: data.number ?? '',
    complement: data.complement ?? '',
    neighborhood: data.neighborhood ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
    photoDataUrl: data.photoDataUrl ?? '',
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
    title: 'Entre na videochamada',
    description: 'O paciente usa este equipamento para falar com o médico.',
  },
  {
    step: 4,
    title: 'Finalize e libere o Terminal',
    description: 'Encerre a consulta para atender o próximo paciente.',
  },
]
