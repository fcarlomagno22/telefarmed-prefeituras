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
  unitName: 'UBS Centro — Sala de Teleatendimento',
  stationLabel: 'Computador 01',
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
    name: data.fullName,
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
    title: 'Finalize e libere o posto',
    description: 'Encerre a consulta para atender o próximo paciente.',
  },
]
