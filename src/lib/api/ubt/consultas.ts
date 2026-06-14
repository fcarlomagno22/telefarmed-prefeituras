import { ApiError, apiFetch } from '../http'

export class UbtConsultasApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'UbtConsultasApiError'
  }
}

function mapError(error: unknown): UbtConsultasApiError {
  if (error instanceof ApiError) {
    return new UbtConsultasApiError(error.message, error.status, error.code)
  }
  return new UbtConsultasApiError('Não foi possível completar a requisição.', 0)
}

export type UbtIniciarConsultaBody = {
  codigoAtendimento: string
  pacienteId: string
  especialidadeId: string
  filaEsperaId?: string
  agendaConsultaId?: string
  profissionalId?: string
  tipo?: 'consulta' | 'retorno' | 'primeira_consulta'
  triagemResumo?: string
}

export type UbtIniciarConsultaResult = {
  codigoAtendimento: string
  consultaId: string
  pacienteId: string
  especialidadeId: string
  filaEsperaId: string | null
  agendaConsultaId: string | null
  doctorName: string
  startedAt: string
}

export type UbtSalaEsperaEntrada = {
  position: number
  total: number
  status: 'chamado'
  estimatedMinutes: number
  readyForConsultation: boolean
}

export type UbtConsultationRecord = {
  id: string
  pacienteId?: string
  date: string
  time: string
  patientName: string
  cpf: string
  age: number
  gender: 'F' | 'M'
  specialty: string
  specialtyId: string
  doctorName: string
  doctorCrm: string
  neighborhood: string
  type: 'retorno' | 'consulta' | 'primeira_consulta'
  status: 'concluida' | 'cancelada' | 'em_andamento'
  durationMinutes: number | null
}

export type UbtConsultasOverview = {
  summary: {
    total: number
    completed: number
    cancelled: number
    inProgress: number
  }
  avgDurationMinutes: number | null
  statusDistribution: Array<{
    key: 'concluida' | 'cancelada' | 'em_andamento'
    label: string
    count: number
    percent: number
    color: string
    gradientFrom: string
    gradientTo: string
  }>
  specialtyDistribution: Array<{ label: string; count: number; percent: number }>
  genderDistribution: Array<{
    key: string
    label: string
    shortLabel: string
    count: number
    percent: number
    gradientFrom: string
    gradientTo: string
  }>
  filterOptions: {
    specialties: Array<{ value: string; label: string }>
    doctors: Array<{ value: string; label: string }>
    neighborhoods: Array<{ value: string; label: string }>
  }
}

export type UbtConsultasListParams = {
  periodStart: string
  periodEnd: string
  specialty?: string
  doctor?: string
  neighborhood?: string
  gender?: string
  ageRange?: string
  status?: string
  generalSearch?: string
}

function buildConsultasQuery(params: UbtConsultasListParams & { page?: number; pageSize?: number }) {
  const query = new URLSearchParams()
  query.set('periodStart', params.periodStart)
  query.set('periodEnd', params.periodEnd)
  if (params.specialty) query.set('specialty', params.specialty)
  if (params.doctor) query.set('doctor', params.doctor)
  if (params.neighborhood) query.set('neighborhood', params.neighborhood)
  if (params.gender) query.set('gender', params.gender)
  if (params.ageRange) query.set('ageRange', params.ageRange)
  if (params.status) query.set('status', params.status)
  if (params.generalSearch?.trim()) query.set('generalSearch', params.generalSearch.trim())
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))
  return query.toString()
}

export async function apiFetchUbtConsultasOverview(
  accessToken: string,
  periodStart: string,
  periodEnd: string,
) {
  try {
    const query = buildConsultasQuery({ periodStart, periodEnd })
    return await apiFetch<UbtConsultasOverview>(`/ubt/consultas/overview?${query}`, {
      accessToken,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiFetchUbtConsultasList(
  accessToken: string,
  filters: UbtConsultasListParams,
  page: number,
  pageSize: number,
) {
  try {
    const query = buildConsultasQuery({ ...filters, page, pageSize })
    return await apiFetch<{
      records: UbtConsultationRecord[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>(`/ubt/consultas?${query}`, { accessToken })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiIniciarUbtConsulta(accessToken: string, body: UbtIniciarConsultaBody) {
  try {
    return await apiFetch<UbtIniciarConsultaResult>('/ubt/consultas/iniciar', {
      accessToken,
      method: 'POST',
      json: body,
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiEntrarUbtSalaEspera(accessToken: string, codigoAtendimento: string) {
  try {
    return await apiFetch<UbtSalaEsperaEntrada>('/ubt/consultas/sala-espera/entrar', {
      accessToken,
      method: 'POST',
      json: { codigoAtendimento },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiSairUbtSalaEspera(accessToken: string, codigoAtendimento: string) {
  try {
    await apiFetch<void>('/ubt/consultas/sala-espera/sair', {
      accessToken,
      method: 'POST',
      json: { codigoAtendimento },
    })
  } catch (error) {
    throw mapError(error)
  }
}

export async function apiRegistrarUbtConsultaAvaliacao(
  accessToken: string,
  codigoAtendimento: string,
  nota: number,
  comentario?: string,
) {
  try {
    await apiFetch<void>('/ubt/consultas/avaliacao', {
      accessToken,
      method: 'POST',
      json: { codigoAtendimento, nota, comentario },
    })
  } catch (error) {
    throw mapError(error)
  }
}
