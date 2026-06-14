import type { AdminEscalaShift, EscalaRepasseRule } from '../../../types/adminEscala'
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
  if (payload.removeShiftIds?.length) {
    shiftsState = shiftsState.filter((item) => !payload.removeShiftIds?.includes(item.id))
  }
  if (payload.replaceBatchId) {
    shiftsState = shiftsState.filter((item) => item.batchId !== payload.replaceBatchId)
  }
  const created: AdminEscalaShift[] = payload.shifts.map((item, index) => {
    const specialtyName =
      item.specialty ??
      adminConfiguracoesInitial.specialties.find((specialty) => specialty.id === item.specialtyId)?.name ??
      'Especialidade'
    return {
      id: `esc-${Date.now()}-${index}`,
      batchId: payload.batchId,
      contratoEntidadeId: payload.contratoEntidadeId ?? null,
      assignmentMode: item.assignmentMode,
      primaryDoctorId: item.primaryDoctorId ?? '',
      backupDoctorIds: item.backupDoctorIds ?? [],
      specialtyId: item.specialtyId,
      specialty: specialtyName,
      modality: item.modality,
      startAt: item.startAt,
      endAt: item.endAt,
      turn: 'manha',
      turnLabel: 'Manhã',
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
      claimedCaptures: [],
      notes: item.notes ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })
  shiftsState = [...created, ...shiftsState]
  return mockDelay(
    {
      shifts: clone(created),
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
  row.status = 'cancelada'
  row.notes = motivoCancelamento
  row.updatedAt = new Date().toISOString()
  return mockDelay(undefined, 60)
}
