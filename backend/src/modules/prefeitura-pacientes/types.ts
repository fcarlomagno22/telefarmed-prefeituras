import type {
  AdminMunicipalPatientDetailDto,
  AdminMunicipalPatientDto,
  PreCadastroRegistrationInput,
  UpdatePacienteInput,
} from '../admin-pacientes/types.js'

export type PrefeituraMunicipalPatientDto = Omit<
  AdminMunicipalPatientDto,
  'municipality' | 'contractStatus' | 'registrationMonthLabel' | 'contractingEntityId' | 'contractingEntityRazaoSocial'
>

export type PrefeituraPacientesSummaryDto = {
  totalPatients: number
  newThisMonth: number
  incompleteRecords: number
  inactiveSixMonths: number
}

export type PrefeituraPacientesAboutDto = {
  newRegistrationsByMonth: { label: string; count: number }[]
  registrationsByNeighborhood: { label: string; registrations: number }[]
  registrationsByFirstUnit: { label: string; registrations: number }[]
}

export type PrefeituraPacientesFiltrosDto = {
  municipio: string
  uf: string
  ubts: { id: string; nome: string }[]
  bairros: string[]
}

export type PrefeituraPacientesListResponse = {
  rows: PrefeituraMunicipalPatientDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListPrefeituraPacientesQuery = {
  search?: string
  cpf?: string
  nome?: string
  unidadeUbtId?: string
  unidadeUbtIds?: string[]
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso' | 'all'
  bairros?: string[]
  inactiveConsultation?: 'all' | '6m' | '12m' | 'never'
  dataQuality?: 'all' | 'complete' | 'incomplete'
  sortBy?: 'name_asc' | 'name_desc' | 'registered_desc' | 'registered_asc'
  page?: number
  pageSize?: number
}

export type CreatePrefeituraPacienteInput = Omit<
  PreCadastroRegistrationInput,
  'entidadeContratanteId' | 'concluirImmediately'
> & {
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso'
}

export type UpdatePrefeituraPacienteInput = UpdatePacienteInput

export type PrefeituraMunicipalPatientDetailDto = PrefeituraMunicipalPatientDto &
  Pick<AdminMunicipalPatientDetailDto, 'ubts' | 'consultations' | 'profile'>

export type PrefeituraPacienteAnnotationDto = {
  id: string
  text: string
  createdAt: string
  authorLabel: string
}

export type PrefeituraPacienteContactLogDto = {
  id: string
  at: string
  channel: 'whatsapp' | 'sms' | 'telefone' | 'presencial' | 'outro'
  phone: string
  note: string
  authorLabel: string
}

export type PrefeituraPacientesScope = {
  entidadeContratanteId: string
  operadorId: string
  operadorNome: string
}
