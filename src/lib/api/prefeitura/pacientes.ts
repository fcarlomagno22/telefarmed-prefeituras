import type { PrefeituraMunicipalPatient } from '../../../data/prefeituraMunicipalPatientsMock'
import type { PrefeituraMunicipalPatientDetail } from '../../../types/prefeituraPacientes'
import type { PrefeituraMunicipalPatientsAbout } from '../../../data/prefeituraMunicipalPatientsMock'
import type {
  ListPrefeituraPacientesParams,
  PrefeituraPacientesFiltrosResponse,
  PrefeituraPacientesListResponse,
  PrefeituraPacientesSummaryResponse,
} from '../../mockServices/prefeitura/pacientes'
import { ApiError, apiFetch } from '../http'

export class PrefeituraPacientesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'PrefeituraPacientesApiError'
  }
}

function mapApiError(error: unknown): PrefeituraPacientesApiError {
  if (error instanceof ApiError) {
    return new PrefeituraPacientesApiError(error.message, error.status, error.code)
  }
  return new PrefeituraPacientesApiError('Não foi possível completar a requisição.', 0)
}

function buildListQuery(params: ListPrefeituraPacientesParams = {}): string {
  const search = new URLSearchParams()

  if (params.search?.trim()) search.set('search', params.search.trim())
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.inactiveConsultation && params.inactiveConsultation !== 'all') {
    search.set('inactiveConsultation', params.inactiveConsultation)
  }
  if (params.dataQuality && params.dataQuality !== 'all') {
    search.set('dataQuality', params.dataQuality)
  }
  if (params.sortBy) search.set('sortBy', params.sortBy)

  for (const id of params.unidadeUbtIds ?? []) {
    search.append('unidadeUbtIds', id)
  }
  for (const bairro of params.bairros ?? []) {
    search.append('bairros', bairro)
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export type CreatePrefeituraPacientePayload = {
  unidadeUbtId?: string
  fullName: string
  socialName?: string
  cpf: string
  birthDate: string
  gender: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  contacts?: Array<{ id?: string; name: string; phone: string; relationship?: string }>
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  photoDataUrl?: string
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso'
}

export type UpdatePrefeituraPacientePayload = Partial<CreatePrefeituraPacientePayload>

export async function apiFetchPrefeituraPacientesSummary(accessToken: string) {
  try {
    return await apiFetch<{
      summary: PrefeituraPacientesSummaryResponse
      about: PrefeituraMunicipalPatientsAbout
    }>('/prefeitura/pacientes/summary', { accessToken })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchPrefeituraPacientesFiltros(accessToken: string) {
  try {
    return await apiFetch<PrefeituraPacientesFiltrosResponse>('/prefeitura/pacientes/filtros', {
      accessToken,
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchPrefeituraPacientesRows(
  accessToken: string,
  params: ListPrefeituraPacientesParams = {},
) {
  try {
    return await apiFetch<PrefeituraPacientesListResponse>(
      `/prefeitura/pacientes${buildListQuery(params)}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiFetchPrefeituraPacienteById(accessToken: string, id: string) {
  try {
    const data = await apiFetch<{ paciente: PrefeituraMunicipalPatientDetail }>(
      `/prefeitura/pacientes/${id}`,
      { accessToken },
    )
    return data.paciente
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreatePrefeituraPaciente(
  accessToken: string,
  payload: CreatePrefeituraPacientePayload,
) {
  try {
    const data = await apiFetch<{ paciente: PrefeituraMunicipalPatient }>('/prefeitura/pacientes', {
      method: 'POST',
      accessToken,
      json: payload,
    })
    return data.paciente
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiUpdatePrefeituraPaciente(
  accessToken: string,
  id: string,
  payload: UpdatePrefeituraPacientePayload,
) {
  try {
    const data = await apiFetch<{ paciente: PrefeituraMunicipalPatientDetail }>(
      `/prefeitura/pacientes/${id}`,
      {
        method: 'PATCH',
        accessToken,
        json: payload,
      },
    )
    return data.paciente
  } catch (error) {
    throw mapApiError(error)
  }
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

export async function apiFetchPrefeituraPacienteAnotacoes(accessToken: string, pacienteId: string) {
  try {
    const data = await apiFetch<{ anotacoes: PrefeituraPacienteAnnotation[] }>(
      `/prefeitura/pacientes/${pacienteId}/anotacoes`,
      { accessToken },
    )
    return data.anotacoes
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreatePrefeituraPacienteAnotacao(
  accessToken: string,
  pacienteId: string,
  text: string,
) {
  try {
    const data = await apiFetch<{ anotacao: PrefeituraPacienteAnnotation }>(
      `/prefeitura/pacientes/${pacienteId}/anotacoes`,
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

export async function apiFetchPrefeituraPacienteContatosRegistrados(
  accessToken: string,
  pacienteId: string,
) {
  try {
    const data = await apiFetch<{ contatos: PrefeituraPacienteContactLog[] }>(
      `/prefeitura/pacientes/${pacienteId}/contatos-registrados`,
      { accessToken },
    )
    return data.contatos
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function apiCreatePrefeituraPacienteRegistroContato(
  accessToken: string,
  pacienteId: string,
  body: {
    channel: PrefeituraPacienteContactLog['channel']
    phone?: string
    note: string
  },
) {
  try {
    const data = await apiFetch<{ contato: PrefeituraPacienteContactLog }>(
      `/prefeitura/pacientes/${pacienteId}/contatos-registrados`,
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
