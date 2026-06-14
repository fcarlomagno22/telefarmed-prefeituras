import { buildProfissionalAgendaTourDemoShifts } from '../../../data/profissionalAgendaTourMock'
import { getActiveNotices } from '../../../data/profissionalAgendaNotices'
import { getProfissionalQueue } from '../../../data/profissionalQueueStore'
import type { ProfissionalQueuePatient, ProfissionalShift } from '../../../types/profissionalAgenda'
import { mockDelay } from '../delay'

export class ProfissionalAgendaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalAgendaApiError'
    this.status = status
    this.code = code
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

export type ProfissionalAgendaConsultaApi = ProfissionalQueuePatient & {
  plantaoId: string
  escalaSlotId: string | null
}

export type ProfissionalAgendaOverviewApi = {
  dateFrom: string
  dateTo: string
  plantoes: ProfissionalAgendaPlantaoApi[]
  consultas: ProfissionalAgendaConsultaApi[]
  shiftCountByDate: Record<string, number>
  notices: import('../../../types/profissionalAgenda').ProfissionalAgendaNotice[]
}

export function isProfissionalAgendaApiError(error: unknown): error is ProfissionalAgendaApiError {
  return error instanceof ProfissionalAgendaApiError
}

function shiftToPlantao(shift: ProfissionalShift): ProfissionalAgendaPlantaoApi {
  return {
    shiftId: shift.id,
    plantaoId: shift.plantaoId,
    escalaSlotId: shift.escalaShiftId,
    dateKey: shift.dateKey,
    municipality: shift.municipality,
    ubtLabel: shift.ubtLabel,
    specialty: shift.specialty,
    turnLabel: shift.turnLabel,
    startAt: shift.startAt,
    endAt: shift.endAt,
    startTime: shift.startTime,
    endTime: shift.endTime,
    role: shift.role,
    modality: shift.modality === 'presencial_ubt' ? 'presencial' : 'tele',
    modalityLabel: shift.modalityLabel,
    plantaoStatus: 'ativo',
    stats: shift.stats,
  }
}

function buildConsultas(): ProfissionalAgendaConsultaApi[] {
  const shifts = buildProfissionalAgendaTourDemoShifts()
  const consultas: ProfissionalAgendaConsultaApi[] = []

  for (const shift of shifts) {
    const queue = getProfissionalQueue(shift.id)
    for (const patient of queue) {
      consultas.push({
        ...patient,
        plantaoId: shift.plantaoId,
        escalaSlotId: shift.escalaShiftId,
      })
    }
  }

  return consultas
}

function buildOverview(dateFrom: string, dateTo: string): ProfissionalAgendaOverviewApi {
  const plantoes = buildProfissionalAgendaTourDemoShifts()
    .filter((shift) => shift.dateKey >= dateFrom && shift.dateKey <= dateTo)
    .map(shiftToPlantao)

  const shiftCountByDate: Record<string, number> = {}
  for (const plantao of plantoes) {
    shiftCountByDate[plantao.dateKey] = (shiftCountByDate[plantao.dateKey] ?? 0) + 1
  }

  return {
    dateFrom,
    dateTo,
    plantoes,
    consultas: buildConsultas(),
    shiftCountByDate,
    notices: getActiveNotices(),
  }
}

export async function fetchProfissionalAgendaOverview(
  _accessToken: string,
  params: { dateFrom: string; dateTo: string },
): Promise<ProfissionalAgendaOverviewApi> {
  return mockDelay(buildOverview(params.dateFrom, params.dateTo))
}

export async function fetchProfissionalAgendaDay(_accessToken: string, date: string) {
  const overview = buildOverview(date, date)
  return mockDelay({
    date,
    plantoes: overview.plantoes.filter((plantao) => plantao.dateKey === date),
    consultas: overview.consultas.filter((consulta) => {
      const shift = overview.plantoes.find((item) => item.shiftId === consulta.shiftId)
      return shift?.dateKey === date
    }),
  })
}

export async function fetchProfissionalAgendaPlantaoConsultas(
  _accessToken: string,
  plantaoId: string,
): Promise<ProfissionalAgendaConsultaApi[]> {
  const consultas = buildConsultas().filter((consulta) => consulta.plantaoId === plantaoId)
  return mockDelay(consultas)
}
