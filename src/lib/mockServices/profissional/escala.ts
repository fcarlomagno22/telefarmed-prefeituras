import { profissionalEscalaMonthlyStats } from '../../../data/profissionalEscalaDisponivelMock'
import { claimEscalaShift, getEscalaShifts, releaseEscalaShift } from '../../../data/escalaSharedStore'
import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import { listProfissionalDisponivelFromAdminShifts } from '../../../utils/escala/adminEscalaToProfissional'
import { mockDelay } from '../delay'

export class ProfissionalEscalaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalEscalaApiError'
    this.status = status
    this.code = code
  }
}

export type ProfissionalEscalaSummaryApi = {
  claimedThisMonth: number
  grossRevenueCents: number
  acceptanceRatePercent: number
  pendingInscriptions: number
}

export type ProfissionalEscalaSlotApi = ProfissionalEscalaDisponivel & {
  inscricaoId?: string
  plantaoId?: string
}

export type ProfissionalPlantaoApi = ProfissionalEscalaSlotApi & {
  plantaoId: string
  plantaoStatus: string
  confirmadoEm: string
}

function listAllShifts(): ProfissionalEscalaDisponivel[] {
  return listProfissionalDisponivelFromAdminShifts(getEscalaShifts(), {
    forDoctorId: profissionalLoggedProfile.id,
  })
}

function filterByDateRange(
  shifts: ProfissionalEscalaDisponivel[],
  params?: { dateFrom?: string; dateTo?: string },
) {
  if (!params?.dateFrom && !params?.dateTo) return shifts

  return shifts.filter((shift) => {
    const dateKey = shift.startAt.slice(0, 10)
    if (params.dateFrom && dateKey < params.dateFrom) return false
    if (params.dateTo && dateKey > params.dateTo) return false
    return true
  })
}

function shiftToPlantao(shift: ProfissionalEscalaDisponivel): ProfissionalPlantaoApi {
  return {
    ...shift,
    plantaoId: `plantao-${shift.id}`,
    plantaoStatus: 'confirmado',
    confirmadoEm: new Date().toISOString(),
    inscricaoId: `insc-${shift.id}`,
  }
}

function buildSummary(): ProfissionalEscalaSummaryApi {
  const shifts = listAllShifts()
  const reservedCount = shifts.filter((shift) => shift.status === 'reservado_mim').length
  const availableCount = shifts.filter((shift) => shift.status === 'disponivel').length

  return {
    claimedThisMonth: profissionalEscalaMonthlyStats.claimedCount,
    grossRevenueCents: profissionalEscalaMonthlyStats.grossRevenueCents,
    acceptanceRatePercent: profissionalEscalaMonthlyStats.acceptanceRatePercent,
    pendingInscriptions: reservedCount + availableCount,
  }
}

export function isProfissionalEscalaApiError(error: unknown): error is ProfissionalEscalaApiError {
  return error instanceof ProfissionalEscalaApiError
}

export async function fetchProfissionalEscalaDisponiveis(
  _accessToken: string,
  params?: { dateFrom?: string; dateTo?: string },
): Promise<ProfissionalEscalaSlotApi[]> {
  void _accessToken
  const shifts = filterByDateRange(listAllShifts(), params).filter(
    (shift) => shift.status === 'disponivel',
  )
  return mockDelay(shifts)
}

export async function fetchProfissionalMeusPlantoes(_accessToken: string) {
  void _accessToken
  const plantoes = listAllShifts()
    .filter((shift) => shift.status === 'reservado_mim')
    .map(shiftToPlantao)
  return mockDelay(plantoes)
}

export async function fetchProfissionalEscalaSummary(_accessToken: string) {
  void _accessToken
  return mockDelay(buildSummary())
}

export async function inscreverProfissionalEscalaSlot(_accessToken: string, slotId: string) {
  void _accessToken
  const claimed = claimEscalaShift(slotId)
  if (!claimed) {
    throw new ProfissionalEscalaApiError(
      'Não foi possível reservar este plantão.',
      409,
      'SLOT_UNAVAILABLE',
    )
  }

  const shift = listAllShifts().find((item) => item.id === slotId)
  if (!shift) {
    throw new ProfissionalEscalaApiError('Plantão não encontrado.', 404, 'SLOT_NOT_FOUND')
  }

  return mockDelay({
    slot: shift,
    plantaoId: `plantao-${slotId}`,
    inscricaoId: `insc-${slotId}`,
  })
}

export async function cancelarProfissionalEscalaInscricao(
  _accessToken: string,
  _inscricaoId: string,
) {
  void _accessToken
  void _inscricaoId
  return mockDelay(undefined)
}

export async function cancelarProfissionalEscalaPlantao(
  _accessToken: string,
  plantaoId: string,
) {
  void _accessToken
  const slotId = plantaoId.startsWith('plantao-') ? plantaoId.slice('plantao-'.length) : plantaoId
  releaseEscalaShift(slotId, profissionalLoggedProfile.id)
  return mockDelay(undefined)
}
