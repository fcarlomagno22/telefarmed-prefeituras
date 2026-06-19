import type {
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../../../types/adminPacientes'
import type { PatientProntuarioData } from '../../../types/patientProntuario'
import { API_BASE_URL } from '../config'
import { ApiError, apiFetch } from '../http'

export class AdminPacientesApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'AdminPacientesApiError'
  }
}

function mapError(error: unknown): AdminPacientesApiError {
  if (error instanceof ApiError) {
    return new AdminPacientesApiError(error.message, error.status, error.code)
  }
  return new AdminPacientesApiError('Não foi possível completar a requisição.', 0)
}

export type PacientesSummaryResponse = {
  totalPacientes: number
  novosNoMesAtual: number
  contratoAtivo: number
  contratoEncerrado: number
  registrosIncompletos: number
  novosCadastrosPorMes: { label: string; count: number }[]
  cadastrosPorMunicipio: { label: string; registrations: number }[]
  basePorStatusContratual: { label: string; registrations: number }[]
  municipios: string[]
}

export type PreCadastroRegistrationPayload = {
  entidadeContratanteId: string
  unidadeUbtId?: string
  fullName: string
  socialName?: string
  cpf: string
  birthDate: string
  gender: string
  nationality: string
  raceColor: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  guardianRelationship?: string
  guardianPhone?: string
  guardianAttendanceAuthorized?: boolean
  cns?: string
  cnsPendente?: boolean
  contacts?: { id?: string; name: string; phone: string; relationship?: string }[]
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  residenceMunicipalityIbgeCode?: string
  photoDataUrl?: string
  registrationConsent?: {
    dataReviewed: true
    teleconsultationAuthorized: true
    dataUsageAcknowledged: true
    notificationsAllowed: true
    operatorName: string
    registeredAt: string
    registrationUnitId?: string
    registrationUnitName: string
    operatorUserId?: string
    operatorAdminId?: string
  }
  concluirImmediately?: boolean
}

export type CreatePacientePayload = PreCadastroRegistrationPayload & {
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso'
}

export type PreCadastroCreateResponse = {
  preCadastroId: string
  paciente?: AdminMunicipalPatient
}

export type ListPacientesParams = {
  search?: string
  cpf?: string
  municipio?: string
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso' | 'all'
  contractStatus?: 'ativo' | 'encerrado' | 'all'
  entidadeContratanteId?: string
}

export type UpdatePacientePayload = {
  fullName?: string
  socialName?: string
  birthDate?: string
  gender?: string
  nationality?: string
  raceColor?: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  guardianRelationship?: string
  guardianPhone?: string
  guardianAttendanceAuthorized?: boolean
  cns?: string
  cnsPendente?: boolean
  contacts?: { id?: string; name: string; phone: string; relationship?: string }[]
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  residenceMunicipalityIbgeCode?: string
  photoDataUrl?: string
  registrationConsent?: PreCadastroRegistrationPayload['registrationConsent']
}

function buildQuery(params: ListPacientesParams = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.cpf) query.set('cpf', params.cpf)
  if (params.municipio) query.set('municipio', params.municipio)
  if (params.status) query.set('status', params.status)
  if (params.contractStatus) query.set('contractStatus', params.contractStatus)
  if (params.entidadeContratanteId) query.set('entidadeContratanteId', params.entidadeContratanteId)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function isAdminPacientesApiError(error: unknown): error is AdminPacientesApiError {
  return error instanceof AdminPacientesApiError
}

export async function fetchPacientesSummary(
  accessToken: string,
  params: Pick<ListPacientesParams, 'municipio' | 'entidadeContratanteId'> = {},
): Promise<PacientesSummaryResponse> {
  try {
    return await apiFetch<PacientesSummaryResponse>(`/admin/pacientes/summary${buildQuery(params)}`, {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPacientesRows(
  accessToken: string,
  params: ListPacientesParams = {},
): Promise<AdminMunicipalPatient[]> {
  try {
    const data = await apiFetch<{ pacientes: AdminMunicipalPatient[] }>(
      `/admin/pacientes${buildQuery(params)}`,
      { accessToken },
    )
    return data.pacientes
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPacienteDetail(
  accessToken: string,
  id: string,
): Promise<AdminMunicipalPatientDetail> {
  try {
    const data = await apiFetch<{ paciente: AdminMunicipalPatientDetail }>(
      `/admin/pacientes/${id}`,
      { accessToken },
    )
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPacienteProntuario(
  accessToken: string,
  id: string,
  pin: string,
): Promise<PatientProntuarioData> {
  try {
    const data = await apiFetch<{ prontuario: PatientProntuarioData }>(
      `/admin/pacientes/${id}/prontuario`,
      {
        method: 'POST',
        accessToken,
        json: { pin },
      },
    )
    return data.prontuario
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPacienteByCpf(
  accessToken: string,
  cpf: string,
  entidadeContratanteId?: string,
): Promise<AdminMunicipalPatient | null> {
  try {
    const query = new URLSearchParams({ cpf })
    if (entidadeContratanteId) query.set('entidadeContratanteId', entidadeContratanteId)
    const data = await apiFetch<{ paciente: AdminMunicipalPatient | null }>(
      `/admin/pacientes/by-cpf?${query.toString()}`,
      { accessToken },
    )
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPacientesContractingEntities(
  accessToken: string,
): Promise<AdminPatientContractingEntity[]> {
  try {
    const data = await apiFetch<{ entidades: AdminPatientContractingEntity[] }>(
      '/admin/pacientes/contracting-entities',
      { accessToken },
    )
    return data.entidades
  } catch (error) {
    throw mapError(error)
  }
}

export async function fetchPacientesMunicipios(accessToken: string): Promise<string[]> {
  const summary = await fetchPacientesSummary(accessToken)
  return summary.municipios
}

export async function createPaciente(
  accessToken: string,
  payload: CreatePacientePayload,
): Promise<AdminMunicipalPatientDetail> {
  try {
    const data = await apiFetch<{ paciente: AdminMunicipalPatientDetail }>('/admin/pacientes', {
      method: 'POST',
      accessToken,
      json: payload,
    })
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function createPacientePreCadastroDraft(
  accessToken: string,
  payload: PreCadastroRegistrationPayload,
): Promise<PreCadastroCreateResponse> {
  try {
    return await apiFetch<PreCadastroCreateResponse>('/admin/pacientes/pre-cadastros', {
      method: 'POST',
      accessToken,
      json: { ...payload, concluirImmediately: false },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function concludePacientePreCadastro(
  accessToken: string,
  preCadastroId: string,
): Promise<AdminMunicipalPatient> {
  try {
    const data = await apiFetch<{ paciente: AdminMunicipalPatient }>(
      `/admin/pacientes/pre-cadastros/${preCadastroId}/concluir`,
      {
        method: 'POST',
        accessToken,
      },
    )
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function cancelPacientePreCadastro(
  accessToken: string,
  preCadastroId: string,
): Promise<void> {
  try {
    await apiFetch<void>(`/admin/pacientes/pre-cadastros/${preCadastroId}/cancelar`, {
      method: 'POST',
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function submitPacientePreCadastro(
  accessToken: string,
  payload: PreCadastroRegistrationPayload,
): Promise<AdminMunicipalPatient> {
  try {
    const data = await apiFetch<{ paciente: AdminMunicipalPatient }>(
      '/admin/pacientes/pre-cadastros/concluir',
      {
        method: 'POST',
        accessToken,
        json: payload,
      },
    )
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function inactivatePaciente(
  accessToken: string,
  id: string,
): Promise<AdminMunicipalPatientDetail> {
  try {
    const data = await apiFetch<{ paciente: AdminMunicipalPatientDetail }>(
      `/admin/pacientes/${id}/inativar`,
      {
        method: 'PATCH',
        accessToken,
      },
    )
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function updatePaciente(
  accessToken: string,
  id: string,
  payload: UpdatePacientePayload,
): Promise<AdminMunicipalPatientDetail> {
  try {
    const data = await apiFetch<{ paciente: AdminMunicipalPatientDetail }>(
      `/admin/pacientes/${id}`,
      {
        method: 'PATCH',
        accessToken,
        json: payload,
      },
    )
    return data.paciente
  } catch (error) {
    throw mapError(error)
  }
}

export async function downloadPacientesExport(
  accessToken: string,
  params: ListPacientesParams = {},
): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pacientes/export${buildQuery(params)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const text = await response.text()
      let message = 'Não foi possível exportar os pacientes.'
      try {
        const payload = JSON.parse(text) as { error?: string }
        if (payload.error) message = payload.error
      } catch {
        // ignore
      }
      throw new AdminPacientesApiError(message, response.status)
    }

    const csv = await response.text()
    return new Blob([csv], { type: 'text/csv;charset=utf-8' })
  } catch (error) {
    throw mapError(error)
  }
}

export type {
  AdminContractStatus,
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../../../types/adminPacientes'
