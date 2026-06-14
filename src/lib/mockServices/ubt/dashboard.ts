import { currentUbtUnit } from '../../../config/ubtSession'
import { metrics, nextConsultations, serviceFlow } from '../../../data/dashboardMock'
import type { UbtDashboardConsultaHoje, UbtDashboardOverview } from '../../../types/ubtDashboard'
import { mockDelay } from '../delay'

const serverTime = new Date('2026-05-21T10:30:00.000Z').toISOString()

function toConsultaStatusLabel(status: UbtDashboardConsultaHoje['status']): string {
  if (status === 'waiting') return 'Aguardando'
  if (status === 'confirmed') return 'Confirmada'
  if (status === 'in_progress') return 'Em atendimento'
  if (status === 'completed') return 'Concluída'
  return 'Cancelada'
}

function buildConsultasHoje(): UbtDashboardConsultaHoje[] {
  return nextConsultations.map((item, index) => {
    const status: UbtDashboardConsultaHoje['status'] =
      item.status === 'waiting' ? 'waiting' : 'confirmed'
    const offset = index + 1
    return {
      id: item.id,
      time: item.time,
      patient: item.patient,
      specialty: item.specialty,
      status,
      statusLabel: toConsultaStatusLabel(status),
      pacienteId: `pac-mock-${item.id}`,
      patientCpf: `${String(100 + offset).padStart(3, '0')}.${String(200 + offset).padStart(3, '0')}.${String(300 + offset).padStart(3, '0')}-${String(10 + offset).padStart(2, '0')}`,
      patientPhone: `(11) 9${String(8200 + offset).padStart(4, '0')}-${String(1000 + offset).padStart(4, '0')}`,
      specialtyId: item.specialty.toLowerCase().replace(/\s+/g, '-'),
      filaEsperaId: status === 'waiting' ? `fila-mock-${item.id}` : null,
      filaStatus: status === 'waiting' ? 'aguardando' : null,
      origin: 'agendado',
      callable: status === 'waiting',
    }
  })
}

function buildOverview(): UbtDashboardOverview {
  const consultasHoje = buildConsultasHoje()
  const priorityCount = serviceFlow.find((item) => item.tone === 'red')?.count ?? 0
  return {
    unit: {
      id: currentUbtUnit.id,
      unitName: currentUbtUnit.name,
      stationLabel: 'Terminal principal',
      regionLabel: 'RA Central',
      operationalState: 'online',
      activeTerminals: 3,
      totalTerminals: 4,
    },
    kpis: metrics,
    filaResumo: {
      items: serviceFlow,
      priorityCount,
      avgWaitMinutes: 24,
      serverTime,
    },
    consultasHoje,
    serverTime,
  }
}

export class UbtDashboardApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtDashboardApiError'
    this.status = status
    this.code = code
  }
}

export function isUbtDashboardApiError(error: unknown): error is UbtDashboardApiError {
  return error instanceof UbtDashboardApiError
}

export async function fetchUbtDashboardOverview(_accessToken: string): Promise<UbtDashboardOverview> {
  void _accessToken
  return mockDelay(buildOverview())
}

export async function fetchUbtDashboardKpis(_accessToken: string) {
  void _accessToken
  const overview = buildOverview()
  return mockDelay({ kpis: overview.kpis, serverTime: overview.serverTime })
}

export async function fetchUbtDashboardFilaResumo(_accessToken: string) {
  void _accessToken
  return mockDelay({ filaResumo: buildOverview().filaResumo })
}

export async function fetchUbtDashboardConsultasDoDia(_accessToken: string, limit?: number) {
  void _accessToken
  const consultas = buildOverview().consultasHoje
  return mockDelay({
    consultasHoje: limit != null ? consultas.slice(0, limit) : consultas,
    serverTime,
  })
}
