import type { NetworkUser } from '../data/networkUsersMock'

export type AdminContractStatus = 'ativo' | 'encerrado'

export type AdminPatientContractingEntity = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
  contractStatus: AdminContractStatus
  aceitaPacientesOutrosMunicipios: boolean
}

export type AdminMunicipalPatient = NetworkUser & {
  municipalRecordId: string
  firstAttendanceUnit: string
  registeredAt: string
  monthsWithoutConsultation: number | null
  dataQuality: 'complete' | 'incomplete'
  missingFields: string[]
  municipality: string
  contractStatus: AdminContractStatus
  registrationMonthLabel: 'Dez' | 'Jan' | 'Fev' | 'Mar' | 'Abr' | 'Mai'
  contractingEntityId: string
  contractingEntityRazaoSocial: string
}

export type AdminPatientUbtVinculo = {
  id: string
  nome: string
  principal: boolean
  municipio: string
  uf: string
}

export type AdminPatientConsultation = {
  id: string
  date: string
  time: string
  specialty: string
  professional: string
  status: 'concluida' | 'cancelada' | 'agendada'
  protocol: string
  ubtName: string
}

export type AdminPatientDetailProfile = {
  email: string
  genderLabel: string
  guardianName: string
  guardianCpf: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  contacts: Array<{ id?: string; name: string; phone: string; relationship?: string }>
  registrationUnit: string
  registeredAt: string
  notes: string
}

export type AdminMunicipalPatientDetail = AdminMunicipalPatient & {
  ubts?: AdminPatientUbtVinculo[]
  consultations?: AdminPatientConsultation[]
  profile?: AdminPatientDetailProfile
}
