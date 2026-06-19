import type { AdminEscalaShift, AdminEscalaShiftExecutionDetail, EscalaRepasseRule } from '../../../types/adminEscala'
import { adminEscalaDoctorOptions, adminEscalaShiftsInitial } from '../../../data/adminEscalaMock'
import { adminClientesRows } from '../../../data/adminClientesMock'
import { prefeituraRedeUnits } from '../../../data/prefeituraRedeMock'
import { adminConfiguracoesInitial } from '../../../data/adminConfiguracoesInitial'
import { mockDelay } from '../delay'

export class AdminEscalaApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminEscalaApiError'
    this.status = status
    this.code = code
  }
}

export type EscalaScopePrefeituraApi = {
  mode: 'all' | 'selected'
  prefeituraIds: string[]
  contratosPorPrefeitura?: Record<string, string>
}

export type EscalaScopeUbtApi = {
  mode: 'all' | 'selected' | 'tele_only'
  ubtIds: string[]
}

export type EscalaSummaryApi = {
  publishedCount: number
  openVacancies: number
  claimedThisMonth: number
  fillRatePercent: number
  averageOpenAmountCents: number
  partialCount: number
  withoutBackupCount: number
  draftCount: number
  pendingInscriptions: number
}

export type EscalaDoctorOptionApi = {
  value: string
  label: string
  specialty: string
}

export type EscalaPrefeituraCatalogApi = {
  id: string
  name: string
  municipio: string
  uf: string
  status: string
}

export type EscalaUbtCatalogApi = {
  id: string
  name: string
  municipalityId: string
  municipalityName: string
  region: string
  regionKey: string
  status: 'ativa' | 'manutencao' | 'inativa'
}

export type EscalaSpecialtyCatalogApi = {
  id: string
  name: string
  active: boolean
}

export type EscalaCatalogApi = {
  doctors: EscalaDoctorOptionApi[]
  prefeituras: EscalaPrefeituraCatalogApi[]
  ubts: EscalaUbtCatalogApi[]
  specialties: EscalaSpecialtyCatalogApi[]
}

export type EscalaContratoOptionApi = {
  id: string
  entidadeContratanteId: string
  entidadeNome: string
  numero: string | null
  tipo: string
  tipoLabel: string
  status: string
  statusLabel: string
  dataAssinatura: string
  dataEncerramento: string | null
  especialidadesAutorizadas: string[]
  label: string
}

export type BatchSavePayload = {
  batchId: string
  replaceBatchId?: string
  removeShiftIds?: string[]
  status: 'rascunho' | 'publicada'
  titulo?: string
  contratoEntidadeId?: string
  contratoEntidadeIds?: string[]
  prefeituraScope: EscalaScopePrefeituraApi
  ubtScope: EscalaScopeUbtApi
  shifts: Array<{
    specialtyId: string
    specialty?: string
    startAt: string
    endAt: string
    assignmentMode: 'assigned' | 'open'
    primaryDoctorId?: string
    backupDoctorIds?: string[]
    modality: 'tele' | 'hibrido' | 'presencial_ubt'
    vacancies?: number
    totalVacancies?: number
    amountCents: number
    repasseRule: EscalaRepasseRule
    unitName?: string
    city?: string
    cityUf?: string
    fullAddress?: string | null
    notes?: string
  }>
}

export function isAdminEscalaApiError(error: unknown): error is AdminEscalaApiError {
  return error instanceof AdminEscalaApiError
}

let shiftsState: AdminEscalaShift[] = JSON.parse(JSON.stringify(adminEscalaShiftsInitial))
const inscricoesState: EscalaInscricaoApi[] = []

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function fetchAdminEscalaShifts(
  _accessToken: string,
  params?: Record<string, string | undefined>,
): Promise<AdminEscalaShift[]> {
  void _accessToken
  const filtered = shiftsState.filter((item) => {
    if (params?.status && item.status !== params.status) return false
    if (params?.batchId && item.batchId !== params.batchId) return false
    return true
  })
  return mockDelay(clone(filtered), 60)
}

const mockExecutionByShiftId: Record<string, AdminEscalaShiftExecutionDetail> = {
  'esc-1': {
    slotId: 'esc-1',
    scheduledStartAt: '2026-05-27T08:00:00',
    scheduledEndAt: '2026-05-27T14:00:00',
    executionStatus: 'realizado',
    realizadoCount: 1,
    confirmadoCount: 0,
    totalPlantoes: 1,
    plantoes: [
      {
        plantaoId: 'mock-plantao-esc-1',
        profissionalId: '1',
        profissionalNome: 'Dr. Carlos Mendes',
        plantaoStatus: 'realizado',
        confirmadoEm: '2026-05-26T18:00:00',
        enteredAt: '2026-05-27T07:58:00',
        endedAt: '2026-05-27T14:02:00',
        sessaoAtiva: false,
        plantaoEncerrado: true,
        consultasAgendadas: 8,
        encaixes: 2,
        atendidos: 7,
        naoCompareceu: 2,
        desistiu: 1,
        tempoMedioMin: 14,
        duracaoPlantaoMin: 364,
        percentualOnline: 92,
        encerramentoFormal: true,
      },
    ],
  },
}

export async function fetchAdminEscalaShiftExecution(
  _accessToken: string,
  shiftId: string,
): Promise<AdminEscalaShiftExecutionDetail> {
  void _accessToken
  const shift = shiftsState.find((item) => item.id === shiftId)
  if (!shift) {
    throw new AdminEscalaApiError('Plantão não encontrado.', 404, 'NOT_FOUND')
  }

  const preset = mockExecutionByShiftId[shiftId]
  if (preset) return mockDelay(clone(preset), 80)

  return mockDelay(
    {
      slotId: shift.id,
      scheduledStartAt: shift.startAt,
      scheduledEndAt: shift.endAt,
      executionStatus: shift.executionStatus,
      realizadoCount: shift.realizadoCount,
      confirmadoCount: shift.confirmadoCount,
      totalPlantoes: shift.totalPlantoes,
      plantoes: shift.claimedCaptures.map((capture, index) => ({
        plantaoId: `mock-plantao-${shift.id}-${index}`,
        profissionalId: capture.doctorId,
        profissionalNome: capture.doctorName,
        plantaoStatus: shift.executionStatus === 'realizado' ? 'realizado' : 'confirmado',
        confirmadoEm: capture.claimedAt,
        enteredAt: null,
        endedAt: null,
        sessaoAtiva: false,
        plantaoEncerrado: shift.executionStatus === 'realizado',
        consultasAgendadas: 0,
        encaixes: 0,
        atendidos: 0,
        naoCompareceu: 0,
        desistiu: 0,
        tempoMedioMin: null,
        duracaoPlantaoMin: null,
        percentualOnline: null,
        encerramentoFormal: false,
      })),
    },
    80,
  )
}

export async function fetchAdminEscalaSummary(_accessToken: string): Promise<EscalaSummaryApi> {
  void _accessToken
  const published = shiftsState.filter((item) => item.status === 'publicada')
  const openShifts = published.filter((item) => item.assignmentMode === 'open')
  const openVacancies = openShifts.reduce((sum, item) => sum + Math.max(0, item.vacancies), 0)
  return mockDelay(
    {
      publishedCount: published.length,
      openVacancies,
      claimedThisMonth: published.reduce((sum, item) => sum + item.claimedCaptures.length, 0),
      fillRatePercent: published.length ? Math.round(((published.length - openShifts.length) / published.length) * 100) : 0,
      averageOpenAmountCents: openShifts.length
        ? Math.round(openShifts.reduce((sum, item) => sum + item.amountCents, 0) / openShifts.length)
        : 0,
      partialCount: published.filter((item) => item.assignmentMode === 'open' && item.vacancies > 0).length,
      withoutBackupCount: published.filter((item) => item.backupDoctorIds.length === 0).length,
      draftCount: shiftsState.filter((item) => item.status === 'rascunho').length,
      pendingInscriptions: inscricoesState.filter((item) => item.status === 'pendente').length,
    },
    60,
  )
}

export async function fetchAdminEscalaCatalog(_accessToken: string): Promise<EscalaCatalogApi> {
  void _accessToken
  return mockDelay(
    {
      doctors: clone(adminEscalaDoctorOptions),
      prefeituras: adminClientesRows.map((item) => ({
        id: item.id,
        name: item.prefeitura,
        municipio: item.municipio,
        uf: item.uf,
        status: item.status,
      })),
      ubts: prefeituraRedeUnits.map((item) => ({
        id: item.id,
        name: item.name,
        municipalityId: 'cli-bsb',
        municipalityName: 'Brasília',
        region: item.region,
        regionKey: item.regionKey,
        status: item.status,
      })),
      specialties: adminConfiguracoesInitial.specialties.map((item) => ({
        id: item.id,
        name: item.name,
        active: item.active,
      })),
    },
    60,
  )
}

export async function fetchAdminEscalaContratos(
  _accessToken: string,
  params: {
    prefeituraScope: EscalaScopePrefeituraApi
    specialtyIds?: string[]
  },
): Promise<EscalaContratoOptionApi[]> {
  const entities =
    params.prefeituraScope.mode === 'selected'
      ? adminClientesRows.filter((item) => params.prefeituraScope.prefeituraIds.includes(item.id))
      : adminClientesRows
  return mockDelay(
    entities.flatMap((entity) =>
      entity.contratos.map((contract) => ({
        id: contract.id,
        entidadeContratanteId: entity.id,
        entidadeNome: entity.prefeitura,
        numero: contract.numero ?? null,
        tipo: contract.tipo,
        tipoLabel: contract.tipo,
        status: contract.status,
        statusLabel: contract.status,
        dataAssinatura: contract.dataAssinatura,
        dataEncerramento: contract.dataEncerramento ?? null,
        especialidadesAutorizadas: contract.detalhes?.especialidadesAutorizadas ?? params.specialtyIds ?? [],
        label: `${entity.prefeitura} · ${contract.numero ?? contract.id}`,
      })),
    ),
    60,
  )
}

export async function saveAdminEscalaBatch(
  _accessToken: string,
  payload: BatchSavePayload,
): Promise<{ shifts: AdminEscalaShift[]; programacaoId: string; batchId: string }> {
  const mutableCheckIds = [
    ...(payload.removeShiftIds ?? []),
    ...payload.shifts.map((shift) => shift.id).filter((id): id is string => Boolean(id)),
  ]
  const locked = shiftsState.filter(
    (item) =>
      mutableCheckIds.includes(item.id) &&
      (item.executionStatus === 'em_andamento' || item.executionStatus === 'realizado'),
  )
  if (locked.length > 0) {
    throw new AdminEscalaApiError(
      'Plantões em andamento ou já realizados não podem ser editados.',
      'CONFLICT',
      409,
    )
  }

  if (payload.removeShiftIds?.length) {
    shiftsState = shiftsState.filter((item) => !payload.removeShiftIds?.includes(item.id))
  }

  const existingById = new Map(
    shiftsState
      .filter((item) => item.batchId === (payload.replaceBatchId ?? payload.batchId))
      .map((item) => [item.id, item]),
  )

  if (payload.replaceBatchId && existingById.size === 0) {
    shiftsState = shiftsState.filter((item) => item.batchId !== payload.replaceBatchId)
  }

  const saved: AdminEscalaShift[] = payload.shifts.map((item, index) => {
    const specialtyName =
      item.specialty ??
      adminConfiguracoesInitial.specialties.find((specialty) => specialty.id === item.specialtyId)?.name ??
      'Especialidade'
    const existing = item.id ? existingById.get(item.id) : undefined
    const now = new Date().toISOString()
    const contratoEntidadeIds =
      payload.contratoEntidadeIds ??
      (payload.contratoEntidadeId ? [payload.contratoEntidadeId] : [])
    return {
      id: existing?.id ?? item.id ?? `esc-${Date.now()}-${index}`,
      batchId: payload.batchId,
      contratoEntidadeId: contratoEntidadeIds[0] ?? null,
      contratoEntidadeIds,
      assignmentMode: item.assignmentMode,
      primaryDoctorId: item.primaryDoctorId ?? '',
      backupDoctorIds: item.backupDoctorIds ?? [],
      specialtyId: item.specialtyId,
      specialty: specialtyName,
      modality: item.modality,
      startAt: item.startAt,
      endAt: item.endAt,
      turn: existing?.turn ?? 'manha',
      turnLabel: existing?.turnLabel ?? 'Manhã',
      prefeituraScope: payload.prefeituraScope,
      ubtScope: payload.ubtScope,
      status: payload.status,
      vacancies: item.vacancies ?? 0,
      totalVacancies: item.totalVacancies ?? item.vacancies ?? 0,
      amountCents: item.amountCents,
      repasseRule: item.repasseRule,
      unitName: item.unitName ?? 'UBT',
      city: item.city ?? 'Brasília',
      cityUf: item.cityUf ?? 'Brasília / DF',
      fullAddress: item.fullAddress ?? null,
      claimedCaptures: existing?.claimedCaptures ?? [],
      notes: item.notes ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
  })

  if (payload.replaceBatchId) {
    const keepIds = new Set(saved.map((item) => item.id))
    shiftsState = shiftsState.filter(
      (item) => item.batchId !== payload.replaceBatchId || keepIds.has(item.id),
    )
  }

  const savedIds = new Set(saved.map((item) => item.id))
  shiftsState = [...saved, ...shiftsState.filter((item) => !savedIds.has(item.id))]
  return mockDelay(
    {
      shifts: clone(saved),
      programacaoId: `prog-${payload.batchId}`,
      batchId: payload.batchId,
    },
    80,
  )
}

export async function deleteAdminEscalaShifts(
  _accessToken: string,
  shiftIds: string[],
): Promise<{ message: string; notifiedCount: number }> {
  const locked = shiftsState.filter(
    (item) =>
      shiftIds.includes(item.id) &&
      (item.executionStatus === 'em_andamento' || item.executionStatus === 'realizado'),
  )
  if (locked.length > 0) {
    throw new AdminEscalaApiError(
      'Plantões em andamento ou já realizados não podem ser excluídos.',
      'CONFLICT',
      409,
    )
  }
  shiftsState = shiftsState.filter((item) => !shiftIds.includes(item.id))
  return mockDelay({ message: 'Plantão(ões) excluído(s) com sucesso.', notifiedCount: 0 }, 60)
}

export async function checkAdminEscalaConflicts(
  _accessToken: string,
  payload: {
    doctorIds: string[]
    excludeBatchId?: string
    shifts: Array<{
      id?: string
      batchId?: string
      startAt: string
      endAt: string
      status?: string
      primaryDoctorId?: string
      backupDoctorIds?: string[]
    }>
  },
): Promise<{ conflicts: string[]; hasConflict: boolean }> {
  const conflicts: string[] = []
  for (const shift of payload.shifts) {
    for (const existing of shiftsState) {
      if (payload.excludeBatchId && existing.batchId === payload.excludeBatchId) continue
      const overlap = shift.startAt < existing.endAt && shift.endAt > existing.startAt
      if (!overlap) continue
      if (shift.primaryDoctorId && existing.primaryDoctorId === shift.primaryDoctorId) {
        conflicts.push(`Conflito do médico ${shift.primaryDoctorId} com plantão ${existing.id}`)
      }
    }
  }
  return mockDelay({ conflicts, hasConflict: conflicts.length > 0 }, 50)
}

export type EscalaInscricaoApi = {
  id: string
  slotId: string
  profissionalId: string
  profissionalNome: string
  status: string
  inscritoEm: string
  respondidoEm?: string | null
  motivoRejeicao?: string | null
}

export async function fetchAdminEscalaInscricoes(
  _accessToken: string,
  params?: { status?: string; slotId?: string },
): Promise<EscalaInscricaoApi[]> {
  return mockDelay(
    clone(
      inscricoesState.filter((item) => {
        if (params?.status && item.status !== params.status) return false
        if (params?.slotId && item.slotId !== params.slotId) return false
        return true
      }),
    ),
    50,
  )
}

export async function acceptAdminEscalaInscricao(
  _accessToken: string,
  inscricaoId: string,
): Promise<void> {
  const row = inscricoesState.find((item) => item.id === inscricaoId)
  if (row) {
    row.status = 'aceita'
    row.respondidoEm = new Date().toISOString()
  }
  return mockDelay(undefined, 50)
}

export async function rejectAdminEscalaInscricao(
  _accessToken: string,
  inscricaoId: string,
  motivoRejeicao: string,
): Promise<void> {
  const row = inscricoesState.find((item) => item.id === inscricaoId)
  if (row) {
    row.status = 'rejeitada'
    row.respondidoEm = new Date().toISOString()
    row.motivoRejeicao = motivoRejeicao
  }
  return mockDelay(undefined, 50)
}

export async function cancelAdminEscalaPlantao(
  _accessToken: string,
  plantaoId: string,
  motivoCancelamento: string,
): Promise<void> {
  const row = shiftsState.find((item) => item.id === plantaoId)
  if (!row) throw new AdminEscalaApiError('Plantão não encontrado.', 404)
  if (row.executionStatus === 'em_andamento' || row.executionStatus === 'realizado') {
    throw new AdminEscalaApiError(
      'Plantões em andamento ou já realizados não podem ser suspensos.',
      'CONFLICT',
      409,
    )
  }
  row.status = 'cancelada'
  row.notes = motivoCancelamento
  row.updatedAt = new Date().toISOString()
  return mockDelay(undefined, 60)
}
