import {
  consultasFilterOptions,
  consultasRecords,
  type ConsultasGenderSlice,
  type ConsultasSpecialtySlice,
  type ConsultasStatusSlice,
  type ConsultasSummary,
  type ConsultationRecord,
} from '../../../data/consultasMock'
import type { ConsultasFilters } from '../../../utils/consultasFilters'
import { applyConsultasFilters } from '../../../utils/consultasFilters'
import { computeConsultasOverviewSnapshot } from '../../../utils/consultas/computeConsultasOverview'
import { mockDelay } from '../delay'

export class UbtConsultasApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtConsultasApiError'
    this.status = status
    this.code = code
  }
}

const recordsState: ConsultationRecord[] = structuredClone(consultasRecords)
const sessionsState = new Map<string, Record<string, unknown>>()

function sortByDateDesc(records: ConsultationRecord[]): ConsultationRecord[] {
  return [...records].sort((a, b) => {
    const aKey = `${a.date.split('/').reverse().join('-')} ${a.time}`
    const bKey = `${b.date.split('/').reverse().join('-')} ${b.time}`
    return aKey > bKey ? -1 : aKey < bKey ? 1 : 0
  })
}

function paginate<T>(rows: T[], page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10
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

export function isUbtConsultasApiError(error: unknown): error is UbtConsultasApiError {
  return error instanceof UbtConsultasApiError
}

export type UbtConsultasOverviewApi = {
  summary: ConsultasSummary
  avgDurationMinutes: number | null
  statusDistribution: ConsultasStatusSlice[]
  specialtyDistribution: ConsultasSpecialtySlice[]
  genderDistribution: ConsultasGenderSlice[]
  filterOptions: {
    specialties: Array<{ value: string; label: string }>
    doctors: Array<{ value: string; label: string }>
    neighborhoods: Array<{ value: string; label: string }>
  }
}

export async function fetchUbtConsultasList(
  _accessToken: string,
  filters: ConsultasFilters,
  page: number,
  pageSize: number,
) {
  const filtered = sortByDateDesc(applyConsultasFilters(recordsState, filters))
  const paginated = paginate(filtered, page, pageSize)
  return mockDelay({
    records: paginated.rows,
    pagination: {
      page: paginated.page,
      pageSize: paginated.pageSize,
      total: paginated.total,
      totalPages: paginated.totalPages,
    },
  })
}

export async function fetchUbtConsultasOverview(
  _accessToken: string,
  periodStart: string,
  periodEnd: string,
) {
  void _accessToken
  const snapshot = computeConsultasOverviewSnapshot(recordsState, periodStart, periodEnd)

  return mockDelay<UbtConsultasOverviewApi>({
    summary: snapshot.summary,
    avgDurationMinutes: snapshot.avgDurationMinutes,
    statusDistribution: snapshot.statusDistribution,
    specialtyDistribution: snapshot.specialtyDistribution,
    genderDistribution: snapshot.genderDistribution,
    filterOptions: {
      specialties: [...consultasFilterOptions.specialties],
      doctors: [...consultasFilterOptions.doctors],
      neighborhoods: [...consultasFilterOptions.neighborhoods],
    },
  })
}

export async function iniciarUbtConsulta(
  _accessToken: string,
  body: {
    codigoAtendimento: string
    pacienteId: string
    especialidadeId: string
    filaEsperaId?: string
    agendaConsultaId?: string
    profissionalId?: string
    tipo?: 'consulta' | 'retorno' | 'primeira_consulta'
    triagemResumo?: string
  },
) {
  const session = {
    codigoAtendimento: body.codigoAtendimento,
    pacienteId: body.pacienteId,
    especialidadeId: body.especialidadeId,
    filaEsperaId: body.filaEsperaId ?? null,
    agendaConsultaId: body.agendaConsultaId ?? null,
    profissionalId: body.profissionalId ?? null,
    tipo: body.tipo ?? 'consulta',
    triagemResumo: body.triagemResumo ?? '',
    doctorName: 'Profissional de plantao',
    startedAt: new Date().toISOString(),
  }
  sessionsState.set(body.codigoAtendimento, session)
  return mockDelay(session)
}

export async function registrarUbtConsultaAvaliacao(
  _accessToken: string,
  codigo: string,
  nota: number,
  comentario?: string,
) {
  const session = sessionsState.get(codigo)
  if (!session) {
    throw new UbtConsultasApiError('Sessao nao encontrada.', 404, 'SESSION_NOT_FOUND')
  }

  sessionsState.set(codigo, {
    ...session,
    avaliacao: { nota, comentario: comentario ?? null, createdAt: new Date().toISOString() },
  })
  return mockDelay(undefined)
}
