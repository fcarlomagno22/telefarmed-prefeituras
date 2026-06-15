import type { ProfissionalEndShiftSummary } from '../../../types/profissionalAgenda'
import { apiFetch, ApiError } from '../http'

export class ProfissionalAgendaApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalAgendaApiError'
  }
}

export type ProfissionalAgendaShiftStatsApi = {
  previstos: number
  naFila: number
  atendidos: number
  tempoMedioMin: number
}

export type ProfissionalAgendaPlantaoApi = {
  shiftId: string
  plantaoId: string
  escalaSlotId: string
  dateKey: string
  municipality: string
  ubtLabel: string
  specialty: string
  turnLabel: string
  startAt: string
  endAt: string
  startTime: string
  endTime: string
  role: 'titular' | 'reserva'
  modality: 'tele' | 'presencial'
  modalityLabel: string
  plantaoStatus: string
  stats: ProfissionalAgendaShiftStatsApi
}

export type ProfissionalAgendaConsultaApi = {
  id: string
  agendaConsultaId?: string | null
  shiftId: string
  plantaoId: string
  escalaSlotId: string | null
  patientName: string
  patientAge: number
  patientCpf: string
  specialty: string
  serviceType: string
  triageReason: string
  ubtName: string
  scheduledTime?: string
  origin: 'agendado' | 'espontaneo'
  arrivedAt: string
  status:
    | 'aguardando'
    | 'chamado'
    | 'em_atendimento'
    | 'finalizado'
    | 'nao_compareceu'
    | 'desistiu'
  recallCount: number
  calledAt?: string
  attendanceId?: string
}

export type ProfissionalAgendaNoticeApi = {
  id: string
  type: 'troca' | 'cancelamento' | 'reserva'
  title: string
  body: string
  dateLabel: string
  shiftDateKey?: string
}

export type ProfissionalAgendaOverviewApi = {
  dateFrom: string
  dateTo: string
  plantoes: ProfissionalAgendaPlantaoApi[]
  consultas: ProfissionalAgendaConsultaApi[]
  shiftCountByDate: Record<string, number>
  activeSession: {
    shiftId: string
    plantaoId: string
    enteredAt: string
    endedAt?: string
    scheduledEndAt?: string
    autoClosePending?: boolean
    summary?: ProfissionalEndShiftSummary
  } | null
  notices: ProfissionalAgendaNoticeApi[]
}

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalAgendaApiError {
  if (error instanceof ApiError) {
    return new ProfissionalAgendaApiError(error.message, error.status, error.code)
  }
  return new ProfissionalAgendaApiError(fallbackMessage, 0)
}

export function isProfissionalAgendaApiError(error: unknown): error is ProfissionalAgendaApiError {
  return error instanceof ProfissionalAgendaApiError
}

export async function fetchProfissionalAgendaOverview(
  accessToken: string,
  params: { dateFrom: string; dateTo: string },
): Promise<ProfissionalAgendaOverviewApi> {
  const search = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  try {
    return await apiFetch<ProfissionalAgendaOverviewApi>(
      `/profissional/agenda/overview?${search.toString()}`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar a agenda.')
  }
}

export async function fetchProfissionalAgendaPlantaoConsultas(
  accessToken: string,
  plantaoId: string,
): Promise<ProfissionalAgendaConsultaApi[]> {
  try {
    const data = await apiFetch<{ consultas: ProfissionalAgendaConsultaApi[] }>(
      `/profissional/agenda/plantoes/${encodeURIComponent(plantaoId)}/consultas`,
      { accessToken },
    )
    return data.consultas
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar a fila do plantão.')
  }
}

export async function enterProfissionalAgendaPlantao(
  accessToken: string,
  plantaoId: string,
): Promise<ProfissionalAgendaOverviewApi['activeSession']> {
  try {
    const data = await apiFetch<{ session: ProfissionalAgendaOverviewApi['activeSession'] }>(
      `/profissional/agenda/plantoes/${encodeURIComponent(plantaoId)}/entrar`,
      { method: 'POST', accessToken, json: {} },
    )
    return data.session
  } catch (error) {
    throw mapApiError(error, 'Não foi possível entrar no plantão.')
  }
}

export async function endProfissionalAgendaPlantao(
  accessToken: string,
  plantaoId: string,
  summary: ProfissionalEndShiftSummary,
): Promise<ProfissionalAgendaOverviewApi['activeSession']> {
  try {
    const data = await apiFetch<{ session: ProfissionalAgendaOverviewApi['activeSession'] }>(
      `/profissional/agenda/plantoes/${encodeURIComponent(plantaoId)}/encerrar`,
      { method: 'POST', accessToken, json: summary },
    )
    return data.session
  } catch (error) {
    throw mapApiError(error, 'Não foi possível encerrar o plantão.')
  }
}

export async function markProfissionalAgendaNaoCompareceu(
  accessToken: string,
  consultaId: string,
): Promise<void> {
  try {
    await apiFetch<void>(
      `/profissional/agenda/consultas/${encodeURIComponent(consultaId)}/nao-compareceu`,
      { method: 'POST', accessToken, json: {} },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível registrar a falta.')
  }
}
