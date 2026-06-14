import type { PrefeituraMunicipalPatient } from '../../../data/prefeituraMunicipalPatientsMock'
import type { PrefeituraMunicipalPatientDetail } from '../../../types/prefeituraPacientes'
import {
  prefeituraMunicipalPatients,
  prefeituraMunicipalPatientsAbout,
  prefeituraMunicipalPatientsSummary,
} from '../../../data/prefeituraMunicipalPatientsMock'
import { prefeituraCredentialsUbtOptions } from '../../../data/prefeituraAccessCredentialsMock'
import { mockDelay } from '../delay'

export class PrefeituraPacientesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraPacientesApiError'
    this.status = status
    this.code = code
  }
}

export type PrefeituraPacientesSummaryResponse = {
  totalPatients: number
  newThisMonth: number
  incompleteRecords: number
  inactiveSixMonths: number
}

export type PrefeituraPacientesFiltrosResponse = {
  municipio: string
  uf: string
  ubts: { id: string; nome: string }[]
  bairros: string[]
}

export type PrefeituraPacientesListResponse = {
  rows: PrefeituraMunicipalPatient[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ListPrefeituraPacientesParams = {
  search?: string
  unidadeUbtIds?: string[]
  bairros?: string[]
  inactiveConsultation?: 'all' | '6m' | '12m' | 'never'
  dataQuality?: 'all' | 'complete' | 'incomplete'
  sortBy?: 'name_asc' | 'name_desc' | 'registered_desc' | 'registered_asc'
  page?: number
  pageSize?: number
}

const patientsState: PrefeituraMunicipalPatient[] = structuredClone(prefeituraMunicipalPatients)

const bairros = [...new Set(patientsState.map((row) => row.bairro).filter(Boolean))].sort()

function applyFilters(params: ListPrefeituraPacientesParams) {
  let rows = [...patientsState]

  if (params.search?.trim()) {
    const needle = params.search.trim().toLowerCase()
    rows = rows.filter((row) =>
      [row.name, row.cpf, row.bairro, row.firstAttendanceUnit].join(' ').toLowerCase().includes(needle),
    )
  }
  if (params.unidadeUbtIds?.length) {
    const labels = new Set(
      params.unidadeUbtIds
        .map((id) => prefeituraCredentialsUbtOptions.find((opt) => opt.value === id)?.label)
        .filter(Boolean),
    )
    rows = rows.filter((row) => labels.has(row.firstAttendanceUnit) || params.unidadeUbtIds?.includes(row.id))
  }
  if (params.bairros?.length) {
    rows = rows.filter((row) => params.bairros?.includes(row.bairro))
  }
  if (params.inactiveConsultation === '6m') {
    rows = rows.filter((row) => (row.monthsWithoutConsultation ?? 0) >= 6)
  }
  if (params.inactiveConsultation === '12m') {
    rows = rows.filter((row) => (row.monthsWithoutConsultation ?? 0) >= 12)
  }
  if (params.inactiveConsultation === 'never') {
    rows = rows.filter((row) => row.monthsWithoutConsultation == null)
  }
  if (params.dataQuality === 'complete') {
    rows = rows.filter((row) => row.dataQuality === 'complete')
  }
  if (params.dataQuality === 'incomplete') {
    rows = rows.filter((row) => row.dataQuality === 'incomplete')
  }

  if (params.sortBy === 'name_desc') {
    rows.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'))
  } else if (params.sortBy === 'registered_desc') {
    rows.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
  } else if (params.sortBy === 'registered_asc') {
    rows.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt))
  } else {
    rows.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }

  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return {
    rows: rows.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  }
}

export function isPrefeituraPacientesApiError(error: unknown): error is PrefeituraPacientesApiError {
  return error instanceof PrefeituraPacientesApiError
}

export function mapApiRowToPrefeituraPatient(row: PrefeituraMunicipalPatient): PrefeituraMunicipalPatient {
  return row
}

export async function fetchPrefeituraPacientesSummary(
  _accessToken: string,
): Promise<{ summary: PrefeituraPacientesSummaryResponse; about: typeof prefeituraMunicipalPatientsAbout }> {
  void _accessToken
  return mockDelay({
    summary: { ...prefeituraMunicipalPatientsSummary },
    about: structuredClone(prefeituraMunicipalPatientsAbout),
  })
}

export async function fetchPrefeituraPacientesFiltros(
  _accessToken: string,
): Promise<PrefeituraPacientesFiltrosResponse> {
  void _accessToken
  return mockDelay({
    municipio: 'Brasília',
    uf: 'DF',
    ubts: prefeituraCredentialsUbtOptions.map((option) => ({
      id: option.value,
      nome: option.label,
    })),
    bairros,
  })
}

export async function fetchPrefeituraPacientesRows(
  _accessToken: string,
  params: ListPrefeituraPacientesParams = {},
): Promise<PrefeituraPacientesListResponse> {
  void _accessToken
  const result = applyFilters(params)
  return mockDelay({
    ...result,
    rows: result.rows.map(mapApiRowToPrefeituraPatient),
  })
}

export async function fetchPrefeituraPacienteById(
  _accessToken: string,
  id: string,
): Promise<PrefeituraMunicipalPatientDetail> {
  void _accessToken
  const row = patientsState.find((item) => item.id === id || item.municipalRecordId === id)
  if (!row) {
    throw new PrefeituraPacientesApiError('Paciente não encontrado.', 404, 'PATIENT_NOT_FOUND')
  }
  return mockDelay(mapApiRowToPrefeituraPatient(row))
}

export type PrefeituraPacienteAnnotation = {
  id: string
  text: string
  createdAt: string
  authorLabel: string
}

export type PrefeituraPacienteContactLog = {
  id: string
  at: string
  channel: 'whatsapp' | 'sms' | 'telefone' | 'presencial' | 'outro'
  phone: string
  note: string
  authorLabel: string
}

const annotationsState = new Map<string, PrefeituraPacienteAnnotation[]>()
const contactLogsState = new Map<string, PrefeituraPacienteContactLog[]>()

export async function fetchPrefeituraPacienteAnotacoes(_accessToken: string, pacienteId: string) {
  return mockDelay(structuredClone(annotationsState.get(pacienteId) ?? []))
}

export async function createPrefeituraPacienteAnotacao(
  _accessToken: string,
  pacienteId: string,
  text: string,
) {
  const next: PrefeituraPacienteAnnotation = {
    id: `anot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    createdAt: new Date().toISOString(),
    authorLabel: 'Operador municipal',
  }
  const current = annotationsState.get(pacienteId) ?? []
  annotationsState.set(pacienteId, [next, ...current])
  return mockDelay(structuredClone(next))
}

export async function fetchPrefeituraPacienteContatosRegistrados(
  _accessToken: string,
  pacienteId: string,
) {
  return mockDelay(structuredClone(contactLogsState.get(pacienteId) ?? []))
}

export async function createPrefeituraPacienteRegistroContato(
  _accessToken: string,
  pacienteId: string,
  body: {
    channel: PrefeituraPacienteContactLog['channel']
    phone?: string
    note: string
  },
) {
  const next: PrefeituraPacienteContactLog = {
    id: `contato-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    channel: body.channel,
    phone: body.phone ?? '',
    note: body.note,
    authorLabel: 'Operador municipal',
  }
  const current = contactLogsState.get(pacienteId) ?? []
  contactLogsState.set(pacienteId, [next, ...current])
  return mockDelay(structuredClone(next))
}
