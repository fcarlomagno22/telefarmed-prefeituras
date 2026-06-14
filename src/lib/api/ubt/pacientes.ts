import type { NetworkUser, NetworkUsersAbout } from '../../../data/networkUsersMock'
import type { networkUsersSummary } from '../../../data/networkUsersMock'
import type { PatientLookupContext, PatientLookupResult } from '../../../types/patientLookup'
import type { PatientRegistration } from '../../../types/attendance'
import { normalizePatientRegistration } from '../../../types/attendance'
import { maskCep, maskCpf } from '../../../utils/masks'
import type {
  ListUbtPacientesParams,
  UbtPacienteAnnotation,
  UbtPacienteConsultationRecord,
  UbtPacienteContactLog,
  UbtPacientesFiltrosResponse,
  UbtPacientesListResponse,
} from '../../mockServices/ubt/pacientes'
import {
  mapPatientRegistrationToUbtPayload,
  type UbtPacienteRegistrationDetail,
} from '../../mockServices/ubt/pacientes'
import { ApiError, apiFetch } from '../http'
import { ubtLgpdRequestHeaders } from './lgpdHeaders'

function lgpdFetchOptions(accessToken: string) {
  const lgpdHeaders = ubtLgpdRequestHeaders()
  return {
    accessToken,
    ...(lgpdHeaders ? { headers: lgpdHeaders } : {}),
  }
}

export type { ListUbtPacientesParams, UbtPacientesFiltrosResponse, UbtPacientesListResponse }
export type UbtPacientesSummaryResponse = typeof networkUsersSummary
export type UbtPacientesAboutResponse = NetworkUsersAbout

export class UbtPacientesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtPacientesApiError'
  }
}

function mapApiError(error: unknown): UbtPacientesApiError {
  if (error instanceof ApiError) {
    return new UbtPacientesApiError(error.message, error.status, error.code)
  }
  return new UbtPacientesApiError('Não foi possível completar a requisição.', 0)
}

type ApiLookupResponse =
  | {
      status: 'found'
      patient: PatientRegistration
      patientId?: string
      linkedToUnit: boolean
      contractActive: boolean
    }
  | {
      status: 'found_pending_first_visit'
      patient: PatientRegistration
      patientId?: string
      preCadastroId?: string
      specialtyId: string
      specialtyName: string
      linkedToUnit: boolean
      contractActive: boolean
    }
  | { status: 'not_found' }

function normalizeLookupPatient(patient: PatientRegistration): PatientRegistration {
  return normalizePatientRegistration({
    ...patient,
    cpf: patient.cpf.includes('.') ? patient.cpf : maskCpf(patient.cpf),
    guardianCpf: patient.guardianCpf ? maskCpf(patient.guardianCpf) : '',
    zipCode: patient.zipCode ? maskCep(patient.zipCode) : '',
    contacts: (patient.contacts ?? []).map((contact, index) => ({
      id: contact.id ?? `contact-${index + 1}`,
      name: contact.name ?? '',
      phone: contact.phone ?? '',
      relationship: contact.relationship ?? '',
    })),
  })
}

function mapLookupResponse(response: ApiLookupResponse): PatientLookupResult {
  if (response.status === 'not_found') {
    return { status: 'not_found' }
  }

  if (response.status === 'found_pending_first_visit') {
    return {
      status: 'found_pending_first_visit',
      patient: normalizeLookupPatient(response.patient),
      specialtyId: response.specialtyId,
      specialtyName: response.specialtyName,
      patientId: response.patientId,
    }
  }

  return {
    status: 'found',
    patient: normalizeLookupPatient(response.patient),
    patientId: response.patientId,
  }
}

function buildLookupQuery(cpf: string, context?: PatientLookupContext): string {
  const search = new URLSearchParams()
  search.set('cpf', cpf.replace(/\D/g, ''))
  if (context?.specialtyId) search.set('specialtyId', context.specialtyId)
  if (context?.specialtyName) search.set('specialtyName', context.specialtyName)
  return `?${search.toString()}`
}

export async function apiLookupUbtPatient(
  accessToken: string,
  cpf: string,
  context?: PatientLookupContext,
): Promise<PatientLookupResult> {
  try {
    const response = await apiFetch<ApiLookupResponse>(
      `/ubt/pacientes/lookup${buildLookupQuery(cpf, context)}`,
      lgpdFetchOptions(accessToken),
    )
    return mapLookupResponse(response)
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacienteDetail(
  accessToken: string,
  id: string,
): Promise<UbtPacienteRegistrationDetail> {
  try {
    const data = await apiFetch<{ detail: UbtPacienteRegistrationDetail }>(
      `/ubt/pacientes/${id}`,
      lgpdFetchOptions(accessToken),
    )
    const detail = data.detail
    return {
      ...detail,
      ...normalizeLookupPatient(detail),
      id: detail.id,
    }
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreateUbtPaciente(
  accessToken: string,
  registration: PatientRegistration,
): Promise<NetworkUser> {
  try {
    const data = await apiFetch<{ patient: NetworkUser }>('/ubt/pacientes', {
      method: 'POST',
      accessToken,
      json: mapPatientRegistrationToUbtPayload(registration),
    })
    return data.patient
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUpdateUbtPaciente(
  accessToken: string,
  id: string,
  registration: PatientRegistration,
  options?: { completeRegistration?: boolean },
): Promise<NetworkUser> {
  try {
    const data = await apiFetch<{ patient: NetworkUser }>(`/ubt/pacientes/${id}`, {
      method: 'PATCH',
      accessToken,
      json: {
        ...mapPatientRegistrationToUbtPayload(registration),
        completeRegistration: options?.completeRegistration ?? false,
      },
    })
    return data.patient
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiLinkUbtPacienteVinculo(
  accessToken: string,
  pacienteId: string,
): Promise<NetworkUser> {
  try {
    const data = await apiFetch<{ patient: NetworkUser }>(
      `/ubt/pacientes/${pacienteId}/vinculo`,
      {
        method: 'POST',
        accessToken,
      },
    )
    return data.patient
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUploadUbtPacienteFoto(
  accessToken: string,
  pacienteId: string,
  photoDataUrl: string,
): Promise<NetworkUser> {
  try {
    const data = await apiFetch<{ patient: NetworkUser }>(
      `/ubt/pacientes/${pacienteId}/foto`,
      {
        method: 'POST',
        accessToken,
        json: { photoDataUrl },
      },
    )
    return data.patient
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiRegisterUbtCompletedPatient(
  accessToken: string,
  registration: PatientRegistration,
  existingPatientId?: string,
): Promise<NetworkUser> {
  if (existingPatientId) {
    return apiUpdateUbtPaciente(accessToken, existingPatientId, registration, {
      completeRegistration: true,
    })
  }

  try {
    return await apiCreateUbtPaciente(accessToken, registration)
  } catch (error) {
    if (
      error instanceof UbtPacientesApiError &&
      error.status === 409 &&
      error.code === 'DUPLICATE_CPF'
    ) {
      const lookup = await apiLookupUbtPatient(accessToken, registration.cpf)
      if (lookup.patientId) {
        return apiUpdateUbtPaciente(accessToken, lookup.patientId, registration, {
          completeRegistration: true,
        })
      }
    }
    throw error
  }
}

export function isUbtPacientesApiError(error: unknown): error is UbtPacientesApiError {
  return error instanceof UbtPacientesApiError
}

function buildListQuery(params: ListUbtPacientesParams = {}): string {
  const search = new URLSearchParams()

  if (params.search?.trim()) search.set('search', params.search.trim())
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.gender && params.gender !== 'all') search.set('gender', params.gender)
  if (params.ageGroup && params.ageGroup !== 'all') search.set('ageGroup', params.ageGroup)
  if (params.newUsers && params.newUsers !== 'all') search.set('newUsers', params.newUsers)
  if (params.lastAppointment && params.lastAppointment !== 'all') {
    search.set('lastAppointment', params.lastAppointment)
  }
  if (params.totalAppointments && params.totalAppointments !== 'all') {
    search.set('totalAppointments', params.totalAppointments)
  }
  if (params.inactiveConsultation && params.inactiveConsultation !== 'all') {
    search.set('inactiveConsultation', params.inactiveConsultation)
  }
  if (params.dataQuality && params.dataQuality !== 'all') {
    search.set('dataQuality', params.dataQuality)
  }
  if (params.recentActivityOnly) {
    search.set('recentActivityOnly', 'true')
  }
  if (params.sortBy) search.set('sortBy', params.sortBy)

  for (const bairro of params.bairros ?? []) {
    search.append('bairros', bairro)
  }
  for (const unit of params.registrationUnits ?? []) {
    search.append('registrationUnits', unit)
  }
  for (const item of params.incompleteData ?? []) {
    search.append('incompleteData', item)
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function apiFetchUbtPacientesSummary(accessToken: string) {
  try {
    return await apiFetch<{
      summary: UbtPacientesSummaryResponse
      about: UbtPacientesAboutResponse
    }>('/ubt/pacientes/summary', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacientesFiltros(accessToken: string) {
  try {
    return await apiFetch<UbtPacientesFiltrosResponse>('/ubt/pacientes/filtros', {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export type UbtPatientTerritoryPolicy = {
  municipio: string
  uf: string
  aceitaPacientesOutrosMunicipios: boolean
}

export async function apiFetchUbtPatientTerritoryPolicy(accessToken: string) {
  try {
    return await apiFetch<{ policy: UbtPatientTerritoryPolicy }>(
      '/ubt/pacientes/politica-endereco',
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacientesRows(
  accessToken: string,
  params: ListUbtPacientesParams = {},
) {
  try {
    return await apiFetch<UbtPacientesListResponse>(
      `/ubt/pacientes${buildListQuery(params)}`,
      lgpdFetchOptions(accessToken),
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacienteRow(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{ patient: NetworkUser }>(`/ubt/pacientes/${id}/row`, {
      ...lgpdFetchOptions(accessToken),
    })
    return data.patient
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacienteConsultas(accessToken: string, pacienteId: string) {
  try {
    const data = await apiFetch<{ consultas: UbtPacienteConsultationRecord[] }>(
      `/ubt/pacientes/${pacienteId}/consultas`,
      { accessToken },
    )
    return data.consultas
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacienteAnotacoes(accessToken: string, pacienteId: string) {
  try {
    const data = await apiFetch<{ anotacoes: UbtPacienteAnnotation[] }>(
      `/ubt/pacientes/${pacienteId}/anotacoes`,
      { accessToken },
    )
    return data.anotacoes
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreateUbtPacienteAnotacao(
  accessToken: string,
  pacienteId: string,
  text: string,
) {
  try {
    const data = await apiFetch<{ anotacao: UbtPacienteAnnotation }>(
      `/ubt/pacientes/${pacienteId}/anotacoes`,
      {
        method: 'POST',
        accessToken,
        json: { text },
      },
    )
    return data.anotacao
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchUbtPacienteContatosRegistrados(
  accessToken: string,
  pacienteId: string,
) {
  try {
    const data = await apiFetch<{ contatos: UbtPacienteContactLog[] }>(
      `/ubt/pacientes/${pacienteId}/contatos-registrados`,
      { accessToken },
    )
    return data.contatos
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreateUbtPacienteRegistroContato(
  accessToken: string,
  pacienteId: string,
  body: {
    channel: UbtPacienteContactLog['channel']
    phone?: string
    note: string
  },
) {
  try {
    const data = await apiFetch<{ contato: UbtPacienteContactLog }>(
      `/ubt/pacientes/${pacienteId}/contatos-registrados`,
      {
        method: 'POST',
        accessToken,
        json: body,
      },
    )
    return data.contato
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiInactivateUbtPaciente(accessToken: string, pacienteId: string) {
  try {
    await apiFetch(`/ubt/pacientes/${pacienteId}/inativar`, {
      method: 'PATCH',
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}
