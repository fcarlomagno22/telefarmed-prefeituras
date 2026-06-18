import type {
  NetworkUser,
  networkUsersAbout,
  networkUsersSummary,
} from '../../../data/networkUsersMock'
import { networkUsers, networkUsersAbout as aboutSeed, networkUsersSummary as summarySeed } from '../../../data/networkUsersMock'
import { adminClientesRows } from '../../../data/adminClientesMock'
import { getNetworkUserProfile } from '../../../data/networkUserProfiles'
import { readUbtMockSession } from '../../mockAuth/ubtAuthMock'
import type { PatientLookupContext, PatientLookupResult } from '../../../types/patientLookup'
import { normalizePatientRegistration, type PatientRegistration } from '../../../types/attendance'
import { maskCpf } from '../../../utils/masks'
import { mockDelay } from '../delay'
import { resolveAceitaPacientesOutrosMunicipios } from '../../../config/adminEntidadeTipo'
import type { TipoEntidade } from '../../../types/entidadeBranding'

export class UbtPacientesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtPacientesApiError'
    this.status = status
    this.code = code
  }
}

export type UbtPacientesSummaryResponse = typeof networkUsersSummary

export type UbtPacientesAboutResponse = typeof networkUsersAbout

export type UbtPacientesFiltrosResponse = {
  bairros: string[]
  registrationUnits: string[]
  unidadeUbtId: string
}

export type UbtPatientTerritoryPolicy = {
  municipio: string
  uf: string
  aceitaPacientesOutrosMunicipios: boolean
  tipoEntidade?: TipoEntidade
}

export type UbtPacientesListResponse = {
  rows: NetworkUser[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type UbtPacienteRegistrationDetail = PatientRegistration & {
  id: string
}

export type UbtPacienteLookupResponse = {
  found: boolean
  contractActive: boolean
  linkedToUnit: boolean
  patient: NetworkUser | null
  detail: UbtPacienteRegistrationDetail | null
}

export type ListUbtPacientesParams = {
  search?: string
  bairros?: string[]
  gender?: 'all' | 'feminino' | 'masculino'
  ageGroup?: 'all' | '0-17' | '18-29' | '30-59' | '60+'
  newUsers?: 'all' | 'this_month' | '30d'
  lastAppointment?: 'all' | 'today' | '7d' | '30d' | '90d' | 'inactive' | 'never'
  totalAppointments?: 'all' | 'inactive' | 'low' | 'frequent'
  incompleteData?: Array<'no_phone' | 'no_email' | 'no_emergency_contact'>
  inactiveConsultation?: 'all' | '6m' | '12m' | 'never'
  dataQuality?: 'all' | 'complete' | 'incomplete'
  registrationUnits?: string[]
  recentActivityOnly?: boolean
  sortBy?:
    | 'name_asc'
    | 'name_desc'
    | 'registered_asc'
    | 'registered_desc'
    | 'last_appointment_asc'
    | 'last_appointment_desc'
    | 'total_appointments_asc'
    | 'total_appointments_desc'
  page?: number
  pageSize?: number
}

export type UbtPacienteConsultationRecord = {
  id: string
  date: string
  time: string
  specialty: string
  professional: string
  status: 'concluida' | 'cancelada' | 'agendada'
  protocol: string
  ubtName: string
}

const usersState: NetworkUser[] = structuredClone(networkUsers)
const detailsState = new Map<string, UbtPacienteRegistrationDetail>()
const annotationsState = new Map<string, UbtPacienteAnnotation[]>()
const contactLogsState = new Map<string, UbtPacienteContactLog[]>()
let nextId = 2000

function brFromIso(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function ensureDetail(id: string): UbtPacienteRegistrationDetail | null {
  const cached = detailsState.get(id)
  if (cached) return cached
  const user = usersState.find((item) => item.id === id)
  if (!user) return null
  const profile = getNetworkUserProfile(user)
  const detail: UbtPacienteRegistrationDetail = {
    id: user.id,
    fullName: user.name,
    socialName: '',
    cpf: user.cpf,
    birthDate: user.birthDate,
    gender: profile.genderLabel === 'Masculino' ? 'masculino' : 'feminino',
    phone: user.phone,
    email: profile.email === '—' ? '' : profile.email,
    guardianName: profile.guardianName,
    guardianCpf: profile.guardianCpf,
    contacts: profile.contacts ?? [],
    zipCode: profile.zipCode,
    street: profile.street,
    number: profile.number,
    complement: profile.complement,
    neighborhood: profile.neighborhood,
    city: profile.city,
    state: profile.state,
    photoDataUrl: profile.photoDataUrl ?? '',
  }
  detailsState.set(id, detail)
  return detail
}

function toSortableDate(dateText: string): string {
  const match = dateText.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return '0000-00-00'
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function applyListFilters(params: ListUbtPacientesParams): NetworkUser[] {
  let rows = [...usersState]

  if (params.search?.trim()) {
    const needle = params.search.trim().toLowerCase()
    rows = rows.filter((row) =>
      [row.name, row.cpf, row.phone, row.bairro, row.id].join(' ').toLowerCase().includes(needle),
    )
  }

  if (params.bairros?.length) {
    rows = rows.filter((row) => params.bairros?.includes(row.bairro))
  }

  if (params.registrationUnits?.length) {
    rows = rows.filter((row) =>
      params.registrationUnits?.includes(getNetworkUserProfile(row).registrationUnit),
    )
  }

  if (params.recentActivityOnly) {
    const cutoff = Date.now() - 7 * 86_400_000
    rows = rows.filter((row) => {
      const hasAnnotation = (annotationsState.get(row.id) ?? []).some(
        (item) => new Date(item.createdAt).getTime() >= cutoff,
      )
      const hasContact = (contactLogsState.get(row.id) ?? []).some(
        (item) => new Date(item.at).getTime() >= cutoff,
      )
      return hasAnnotation || hasContact
    })
  }

  if (params.gender && params.gender !== 'all') {
    rows = rows.filter((row) => {
      const profile = getNetworkUserProfile(row)
      return params.gender === 'masculino'
        ? profile.genderLabel === 'Masculino'
        : profile.genderLabel === 'Feminino'
    })
  }

  if (params.ageGroup && params.ageGroup !== 'all') {
    rows = rows.filter((row) => {
      if (params.ageGroup === '0-17') return row.age <= 17
      if (params.ageGroup === '18-29') return row.age >= 18 && row.age <= 29
      if (params.ageGroup === '30-59') return row.age >= 30 && row.age <= 59
      return row.age >= 60
    })
  }

  if (params.sortBy) {
    rows.sort((a, b) => {
      switch (params.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'name_desc':
          return b.name.localeCompare(a.name, 'pt-BR')
        case 'last_appointment_asc':
          return toSortableDate(a.lastAppointmentDate).localeCompare(toSortableDate(b.lastAppointmentDate))
        case 'last_appointment_desc':
          return toSortableDate(b.lastAppointmentDate).localeCompare(toSortableDate(a.lastAppointmentDate))
        case 'total_appointments_asc':
          return a.totalAppointments - b.totalAppointments
        case 'total_appointments_desc':
          return b.totalAppointments - a.totalAppointments
        default:
          return 0
      }
    })
  }

  return rows
}

function paginateRows(rows: NetworkUser[], page = 1, pageSize = 20): UbtPacientesListResponse {
  const safePage = page > 0 ? page : 1
  const safePageSize = pageSize > 0 ? pageSize : 20
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  const start = (safePage - 1) * safePageSize
  return {
    rows: rows.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  }
}

export function isUbtPacientesApiError(error: unknown): error is UbtPacientesApiError {
  return error instanceof UbtPacientesApiError
}

export function mapUbtDetailToPatientRegistration(
  detail: UbtPacienteRegistrationDetail,
): PatientRegistration {
  const birthDateIso = birthDateBrToIso(detail.birthDate)
  return normalizePatientRegistration({
    fullName: detail.fullName,
    socialName: detail.socialName,
    cpf: detail.cpf.includes('.') ? detail.cpf : maskCpf(detail.cpf),
    birthDate: birthDateIso,
    gender: detail.gender,
    phone: detail.phone,
    email: detail.email,
    guardianName: detail.guardianName,
    guardianCpf: detail.guardianCpf,
    contacts: detail.contacts,
    zipCode: detail.zipCode,
    street: detail.street,
    number: detail.number,
    complement: detail.complement,
    neighborhood: detail.neighborhood,
    city: detail.city,
    state: detail.state,
    photoDataUrl: detail.photoDataUrl,
  })
}

function birthDateBrToIso(birthDate: string): string {
  const match = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return birthDate
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

export function mapPatientRegistrationToUbtPayload(
  registration: PatientRegistration,
): Omit<PatientRegistration, 'photoDataUrl'> & { photoDataUrl?: string } {
  const cleanedContacts = (registration.contacts ?? []).filter(
    (contact) => contact.name.trim() && contact.phone.replace(/\D/g, '').length >= 10,
  )

  return {
    fullName: registration.fullName,
    socialName: registration.socialName,
    cpf: registration.cpf,
    birthDate: registration.birthDate,
    gender: registration.gender,
    phone: registration.phone,
    email: registration.email,
    guardianName: registration.guardianName,
    guardianCpf: registration.guardianCpf,
    ...(cleanedContacts.length > 0 ? { contacts: cleanedContacts } : {}),
    zipCode: registration.zipCode,
    street: registration.street,
    number: registration.number,
    complement: registration.complement,
    neighborhood: registration.neighborhood,
    city: registration.city,
    state: registration.state,
    photoDataUrl: registration.photoDataUrl || undefined,
  } as Omit<PatientRegistration, 'photoDataUrl'> & { photoDataUrl?: string }
}

export async function fetchUbtPacientesSummary(
  _accessToken: string,
): Promise<{ summary: UbtPacientesSummaryResponse; about: UbtPacientesAboutResponse }> {
  void _accessToken
  return mockDelay({ summary: summarySeed, about: aboutSeed })
}

export async function fetchUbtPacientesFiltros(
  _accessToken: string,
): Promise<UbtPacientesFiltrosResponse> {
  void _accessToken
  return mockDelay({
    bairros: Array.from(new Set(usersState.map((row) => row.bairro))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    ),
    registrationUnits: Array.from(
      new Set(usersState.map((row) => getNetworkUserProfile(row).registrationUnit)),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    unidadeUbtId: 'ubt_centro',
  })
}

function resolveMockTerritoryPolicy(): UbtPatientTerritoryPolicy {
  const user = readUbtMockSession().user
  if (!user) {
    return {
      municipio: 'São José dos Campos',
      uf: 'SP',
      aceitaPacientesOutrosMunicipios: false,
    }
  }

  const entity = adminClientesRows.find((row) => row.id === user.entidadeContratanteId)
  const activeContract = entity?.contratos.find(
    (contract) => contract.status === 'ativo' || contract.status === 'implantacao',
  )

  return {
    municipio: entity?.municipio ?? user.municipio,
    uf: entity?.uf ?? user.uf,
    tipoEntidade: entity?.tipoEntidade,
    aceitaPacientesOutrosMunicipios: resolveAceitaPacientesOutrosMunicipios(
      entity?.tipoEntidade,
      activeContract?.detalhes?.aceitaPacientesOutrosMunicipios ?? false,
    ),
  }
}

export async function fetchUbtPatientTerritoryPolicy(_accessToken: string) {
  void _accessToken
  return mockDelay({ policy: resolveMockTerritoryPolicy() })
}

export async function fetchUbtPacientesRows(
  _accessToken: string,
  params: ListUbtPacientesParams = {},
): Promise<UbtPacientesListResponse> {
  return mockDelay(paginateRows(applyListFilters(params), params.page ?? 1, params.pageSize ?? 20))
}

export async function fetchUbtPacienteRow(
  _accessToken: string,
  id: string,
): Promise<NetworkUser> {
  void _accessToken
  const row = usersState.find((item) => item.id === id)
  if (!row) throw new UbtPacientesApiError('Paciente nao encontrado.', 404, 'PACIENTE_NOT_FOUND')
  return mockDelay(structuredClone(row))
}

export async function fetchUbtPacienteDetail(
  _accessToken: string,
  id: string,
): Promise<UbtPacienteRegistrationDetail> {
  void _accessToken
  const detail = ensureDetail(id)
  if (!detail) throw new UbtPacientesApiError('Paciente nao encontrado.', 404, 'PACIENTE_NOT_FOUND')
  return mockDelay(structuredClone(detail))
}

export async function fetchUbtPacienteConsultas(_accessToken: string, pacienteId: string) {
  const user = usersState.find((item) => item.id === pacienteId)
  if (!user) throw new UbtPacientesApiError('Paciente nao encontrado.', 404, 'PACIENTE_NOT_FOUND')
  const profile = getNetworkUserProfile(user)
  const consultations: UbtPacienteConsultationRecord[] = profile.consultations.map((consultation) => ({
    ...consultation,
    ubtName: 'UBT Centro',
  }))
  return mockDelay(consultations)
}

export async function inactivateUbtPacienteApi(_accessToken: string, pacienteId: string) {
  const index = usersState.findIndex((item) => item.id === pacienteId)
  if (index < 0) throw new UbtPacientesApiError('Paciente nao encontrado.', 404, 'PACIENTE_NOT_FOUND')
  usersState.splice(index, 1)
  detailsState.delete(pacienteId)
  annotationsState.delete(pacienteId)
  contactLogsState.delete(pacienteId)
  return mockDelay(undefined)
}

export async function lookupUbtPacienteByCpfApi(
  _accessToken: string,
  cpf: string,
): Promise<UbtPacienteLookupResponse> {
  const digits = cpf.replace(/\D/g, '')
  const patient = usersState.find((item) => item.cpf.replace(/\D/g, '') === digits) ?? null
  const detail = patient ? ensureDetail(patient.id) : null
  return mockDelay({
    found: Boolean(patient),
    contractActive: true,
    linkedToUnit: true,
    patient: patient ? structuredClone(patient) : null,
    detail: detail ? structuredClone(detail) : null,
  })
}

export async function lookupUbtPatientForTriage(
  accessToken: string,
  cpf: string,
  context?: PatientLookupContext,
): Promise<PatientLookupResult> {
  const lookup = await lookupUbtPacienteByCpfApi(accessToken, cpf)
  if (!lookup.found || !lookup.detail) {
    return { status: 'not_found' }
  }

  const patient = mapUbtDetailToPatientRegistration(lookup.detail)
  const patientId = lookup.detail.id
  const isIncomplete = lookup.patient?.dataQuality === 'incomplete' || !patient.photoDataUrl.trim()

  if (isIncomplete && context?.specialtyId) {
    return {
      status: 'found_pending_first_visit',
      patient,
      specialtyId: context.specialtyId,
      specialtyName: context.specialtyName,
      patientId,
    }
  }

  return {
    status: 'found',
    patient,
    patientId,
  }
}

export async function createUbtPacienteApi(
  _accessToken: string,
  registration: PatientRegistration,
): Promise<NetworkUser> {
  const id = `mock-paciente-${nextId++}`
  const row: NetworkUser = {
    id,
    name: registration.fullName,
    initials: registration.fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase(),
    avatarClassName: 'bg-emerald-100 text-emerald-700',
    bairro: registration.neighborhood,
    phone: registration.phone,
    cpf: registration.cpf,
    birthDate: brFromIso(registration.birthDate),
    age: 30,
    lastAppointmentDate: '—',
    lastAppointmentRelative: 'Sem atendimento',
    totalAppointments: 0,
    dataQuality: registration.photoDataUrl ? 'complete' : 'incomplete',
  }
  usersState.unshift(row)
  const detail: UbtPacienteRegistrationDetail = {
    ...registration,
    id,
    birthDate: brFromIso(registration.birthDate),
  }
  detailsState.set(id, detail)
  return mockDelay(structuredClone(row))
}

export async function updateUbtPacienteApi(
  _accessToken: string,
  id: string,
  registration: PatientRegistration,
): Promise<NetworkUser> {
  const index = usersState.findIndex((item) => item.id === id)
  if (index < 0) throw new UbtPacientesApiError('Paciente nao encontrado.', 404, 'PACIENTE_NOT_FOUND')
  const current = usersState[index]
  const updated: NetworkUser = {
    ...current,
    name: registration.fullName,
    bairro: registration.neighborhood,
    phone: registration.phone,
    birthDate: brFromIso(registration.birthDate),
  }
  usersState[index] = updated
  detailsState.set(id, { ...registration, id, birthDate: brFromIso(registration.birthDate) })
  return mockDelay(structuredClone(updated))
}

export type UbtPacienteAnnotation = {
  id: string
  text: string
  createdAt: string
  authorLabel: string
}

export type UbtPacienteContactLog = {
  id: string
  at: string
  channel: 'whatsapp' | 'sms' | 'telefone' | 'presencial' | 'outro'
  phone: string
  note: string
  authorLabel: string
}

export async function fetchUbtPacienteAnotacoes(_accessToken: string, pacienteId: string) {
  return mockDelay(structuredClone(annotationsState.get(pacienteId) ?? []))
}

export async function createUbtPacienteAnotacao(
  _accessToken: string,
  pacienteId: string,
  text: string,
) {
  const next: UbtPacienteAnnotation = {
    id: `anot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    createdAt: new Date().toISOString(),
    authorLabel: 'Operador UBT',
  }
  const current = annotationsState.get(pacienteId) ?? []
  annotationsState.set(pacienteId, [next, ...current])
  return mockDelay(structuredClone(next))
}

export async function fetchUbtPacienteContatosRegistrados(_accessToken: string, pacienteId: string) {
  return mockDelay(structuredClone(contactLogsState.get(pacienteId) ?? []))
}

export async function createUbtPacienteRegistroContato(
  _accessToken: string,
  pacienteId: string,
  body: {
    channel: UbtPacienteContactLog['channel']
    phone?: string
    note: string
  },
) {
  const next: UbtPacienteContactLog = {
    id: `contato-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    channel: body.channel,
    phone: body.phone ?? '',
    note: body.note,
    authorLabel: 'Operador UBT',
  }
  const current = contactLogsState.get(pacienteId) ?? []
  contactLogsState.set(pacienteId, [next, ...current])
  return mockDelay(structuredClone(next))
}

export async function registerUbtCompletedPatient(
  accessToken: string,
  registration: PatientRegistration,
  existingPatientId?: string,
): Promise<NetworkUser> {
  if (existingPatientId) {
    return updateUbtPacienteApi(accessToken, existingPatientId, registration)
  }
  return createUbtPacienteApi(accessToken, registration)
}
