import type {
  MonitorComparisonRow,
  MonitorComparisonTab,
  MonitorLiveGridRow,
  MonitorOngoingServiceRow,
  MonitorTimelineSeries,
} from '../../../types/prefeituraMonitor'
import {
  monitorRegionFilterOptions,
  monitorTimelinePeriodOptions,
} from '../../../data/prefeituraMonitorMock'
import { prefeituraRedeUnits } from '../../../data/prefeituraRedeMock'
import { consultasRecords } from '../../../data/consultasMock'
import { mockDelay } from '../delay'

export class PrefeituraMonitorApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraMonitorApiError'
    this.status = status
    this.code = code
  }
}

export type PrefeituraMonitorOverview = {
  liveGrid: MonitorLiveGridRow[]
  timelineHours: string[]
  timelineSeries: MonitorTimelineSeries[]
  rankingByTab: Record<MonitorComparisonTab, MonitorComparisonRow[]>
  ongoingServices: MonitorOngoingServiceRow[]
  filterOptions: {
    region: Array<{ value: string; label: string }>
    timelinePeriod: Array<{ value: string; label: string }>
  }
}

const TIMELINE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6']

function seedFromId(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function buildLiveGrid(regionKey: string): MonitorLiveGridRow[] {
  let units = prefeituraRedeUnits.filter((unit) => unit.status !== 'inativa')
  if (regionKey !== 'todas') {
    const normalized = regionKey === 'central' ? 'centro' : regionKey
    units = units.filter((unit) => unit.regionKey === normalized)
  }

  return units.map((unit) => {
    const seed = seedFromId(unit.id)
    const busy = Math.min(unit.stationsOnline, Math.max(0, (seed % unit.stationsTotal) + 1))
    const free = Math.max(0, unit.stationsOnline - busy)
    const queue = Math.max(0, (seed % 7) - 1)
    const inConsultation = Math.min(busy, 1 + (seed % 2))

    return {
      id: unit.id,
      name: unit.name,
      regionKey: unit.regionKey,
      freeStations: free,
      busyStations: busy,
      queuePatients: queue,
      inConsultation,
      status: unit.status === 'manutencao' ? 'manutencao' : 'ativa',
    }
  })
}

function buildRanking(
  tab: MonitorComparisonTab,
  regionKey: string,
  previewLimit?: number,
): MonitorComparisonRow[] {
  const grid = buildLiveGrid(regionKey)
  const ranked = grid
    .map((row, index) => {
      const seed = seedFromId(`${row.id}-${tab}`)
      const primaryValue =
        tab === 'produtividade'
          ? 40 + (seed % 80)
          : tab === 'abandono'
            ? 4 + (seed % 18)
            : tab === 'espera'
              ? 8 + (seed % 22)
              : 3.5 + (seed % 15) / 10
      const primaryMax =
        tab === 'produtividade' ? 120 : tab === 'abandono' ? 30 : tab === 'espera' ? 35 : 5
      return {
        position: index + 1,
        unitName: row.name,
        primaryValue,
        primaryMax,
        variationPercent: (seed % 20) - 8,
      }
    })
    .sort((a, b) => b.primaryValue - a.primaryValue)
    .map((row, index) => ({ ...row, position: index + 1 }))

  return previewLimit ? ranked.slice(0, previewLimit) : ranked
}

function buildOverview(params: { regionKey: string; timelinePeriod: string }): PrefeituraMonitorOverview {
  const timelineHours = ['08h', '10h', '12h', '14h', '16h', '18h']
  const liveGrid = buildLiveGrid(params.regionKey)
  const topUnits = liveGrid.slice(0, 6)

  const timelineSeries: MonitorTimelineSeries[] = topUnits.map((unit, index) => ({
    unitId: unit.id,
    unitName: unit.name,
    color: TIMELINE_COLORS[index % TIMELINE_COLORS.length]!,
    values: timelineHours.map((_, hourIndex) => {
      const seed = seedFromId(`${unit.id}-${params.timelinePeriod}-${hourIndex}`)
      return 4 + (seed % 18)
    }),
  }))

  const ongoingServices: MonitorOngoingServiceRow[] = liveGrid.slice(0, 6).map((unit, index) => {
    const record = consultasRecords[index % consultasRecords.length]
    return {
      id: `ongoing-${unit.id}`,
      unitRoom: `${unit.name} · Sala ${1 + (index % 3)}`,
      startedAgo: `${5 + index * 3} min`,
      patientName: record?.patientName ?? `Paciente ${index + 1}`,
      specialty: record?.specialty ?? 'Clínica Geral',
      age: record?.age ?? 32,
      professional: record?.doctorName ?? 'Profissional de plantão',
      queue: unit.queuePatients,
    }
  })

  return {
    liveGrid,
    timelineHours,
    timelineSeries,
    rankingByTab: {
      produtividade: buildRanking('produtividade', params.regionKey, 8),
      abandono: buildRanking('abandono', params.regionKey, 8),
      espera: buildRanking('espera', params.regionKey, 8),
      avaliacao: buildRanking('avaliacao', params.regionKey, 8),
    },
    ongoingServices,
    filterOptions: {
      region:
        monitorRegionFilterOptions.length > 1
          ? monitorRegionFilterOptions.map((item) => ({ ...item }))
          : [
              { value: 'todas', label: 'Todas as regiões' },
              { value: 'centro', label: 'Centro' },
              { value: 'norte', label: 'Norte' },
              { value: 'sul', label: 'Sul' },
              { value: 'leste', label: 'Leste' },
              { value: 'oeste', label: 'Oeste' },
            ],
      timelinePeriod: monitorTimelinePeriodOptions.map((item) => ({ ...item })),
    },
  }
}

export function isPrefeituraMonitorApiError(error: unknown): error is PrefeituraMonitorApiError {
  return error instanceof PrefeituraMonitorApiError
}

export async function fetchPrefeituraMonitorOverview(
  _accessToken: string,
  params: { regionKey: string; timelinePeriod: string },
) {
  void _accessToken
  return mockDelay(buildOverview(params), 70)
}

export async function fetchPrefeituraMonitorRanking(
  _accessToken: string,
  params: { tab: MonitorComparisonTab; regionKey: string; timelinePeriod: string },
) {
  void _accessToken
  void params.timelinePeriod
  return mockDelay(buildRanking(params.tab, params.regionKey), 60)
}
