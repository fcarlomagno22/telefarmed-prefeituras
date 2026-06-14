import {
  Activity,
  AlertTriangle,
  Clock3,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../../components/ui/KpiStatCards'
import type { AdminMonitorView, AdminMonitorUnitRow } from '../../../types/adminMonitor'
import { metrics, doctorsOnline } from '../../../data/dashboardMock'
import { prefeituraRedeUnits } from '../../../data/prefeituraRedeMock'
import { adminClientesRows } from '../../../data/adminClientesMock'
import { mockDelay } from '../delay'

export class AdminMonitorApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminMonitorApiError'
    this.status = status
    this.code = code
  }
}

const KPI_ICONS: Record<string, KpiStatCardItem['icon']> = {
  ubts: Activity,
  em_curso: Users,
  aguardando: Clock3,
  filas_criticas: AlertTriangle,
  sla_ocupacao: ShieldAlert,
  no_show: Search,
}

const KPI_STYLES: Record<
  string,
  Pick<KpiStatCardItem, 'iconGradient' | 'iconShadow' | 'iconRing'>
> = {
  ubts: {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
  },
  em_curso: {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
  },
  aguardando: {
    iconGradient: 'from-amber-500 via-orange-500 to-red-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(251,146,60,0.35)]',
    iconRing: 'ring-orange-100/80',
  },
  filas_criticas: {
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
  },
  sla_ocupacao: {
    iconGradient: 'from-violet-500 via-purple-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
  },
  no_show: {
    iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
    iconRing: 'ring-amber-100/80',
  },
}

type OverviewApi = AdminMonitorView & {
  kpis: Array<{ key: string; label: string; value: string; suffix: string; topBar: string }>
}

export type AdminMonitorPageData = AdminMonitorView & {
  kpiCards: KpiStatCardItem[]
}

export function isAdminMonitorApiError(error: unknown): error is AdminMonitorApiError {
  return error instanceof AdminMonitorApiError
}

function mapKpisToCards(kpis: OverviewApi['kpis']): KpiStatCardItem[] {
  return kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    suffix: kpi.suffix,
    topBar: kpi.topBar,
    icon: KPI_ICONS[kpi.key] ?? Activity,
    iconGradient: KPI_STYLES[kpi.key]?.iconGradient ?? KPI_STYLES.ubts.iconGradient,
    iconShadow: KPI_STYLES[kpi.key]?.iconShadow ?? KPI_STYLES.ubts.iconShadow,
    iconRing: KPI_STYLES[kpi.key]?.iconRing ?? KPI_STYLES.ubts.iconRing,
  }))
}

export function mapOverviewToMonitorPageData(overview: OverviewApi): AdminMonitorPageData {
  const { kpis, ...rest } = overview
  return {
    ...rest,
    kpiCards: mapKpisToCards(kpis),
  }
}

export type AdminMonitorQueryParams = {
  entidadeId?: string
  regionKey?: string
  timelinePeriod?: string
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildOverview(params: AdminMonitorQueryParams): OverviewApi {
  const entityMap = new Map(adminClientesRows.map((item) => [item.id, item]))
  const unitRows: AdminMonitorUnitRow[] = prefeituraRedeUnits
    .filter((unit) => !params.regionKey || params.regionKey === 'all' || unit.regionKey === params.regionKey)
    .map((unit, index) => {
      const entity = adminClientesRows[index % adminClientesRows.length]
      return {
        id: unit.id,
        prefeituraId: entity.id,
        prefeitura: entity.prefeitura,
        ubt: unit.name,
        regiao: unit.region,
        regionKey: unit.regionKey,
        status: unit.status,
        emCurso: Math.max(0, unit.stationsOnline - 1),
        fila: Math.max(0, 6 - (unit.stationsOnline % 4)),
        tempoMedio: `${12 + (index % 10)} min`,
        operador: `Operador ${index + 1}`,
        terminal: `${unit.stationsOnline}/${unit.stationsTotal}`,
        ocupacao: Math.min(100, Math.round((unit.stationsOnline / Math.max(1, unit.stationsTotal)) * 100)),
        sla:
          unit.stationsOnline === 0
            ? 'critico'
            : unit.stationsOnline < unit.stationsTotal
              ? 'atencao'
              : 'normal',
      } satisfies AdminMonitorUnitRow
    })
    .filter((row) => !params.entidadeId || params.entidadeId === 'all' || row.prefeituraId === params.entidadeId)

  const consultasLive = unitRows.slice(0, 8).map((row, index) => ({
    id: `live-${row.id}-${index}`,
    prefeitura: row.prefeitura,
    ubt: row.ubt,
    paciente: `Paciente ${index + 1}`,
    especialidade: doctorsOnline[index % doctorsOnline.length]?.specialty ?? 'Clínica Geral',
    medico: doctorsOnline[index % doctorsOnline.length]?.name ?? 'Médico',
    inicio: `${8 + index}:00`,
    status: index % 3 === 0 ? 'Em atendimento' : 'Aguardando confirmação',
  }))

  const kpis = [
    { key: 'ubts', label: 'UBTs ativas', value: String(unitRows.length), suffix: 'na rede', topBar: 'from-sky-400 to-blue-500' },
    {
      key: 'em_curso',
      label: 'Consultas em curso',
      value: String(unitRows.reduce((sum, row) => sum + row.emCurso, 0)),
      suffix: 'atendimentos',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      key: 'aguardando',
      label: 'Pacientes aguardando',
      value: String(unitRows.reduce((sum, row) => sum + row.fila, 0)),
      suffix: 'na fila',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      key: 'filas_criticas',
      label: 'Filas críticas',
      value: String(unitRows.filter((row) => row.fila >= 5).length),
      suffix: 'unidades',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      key: 'sla_ocupacao',
      label: 'SLA/Ocupação',
      value: `${Math.round(unitRows.reduce((sum, row) => sum + row.ocupacao, 0) / Math.max(1, unitRows.length))}%`,
      suffix: 'média',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      key: 'no_show',
      label: 'No-show',
      value: metrics.find((item) => item.id === 'alerts')?.value ?? '0',
      suffix: 'hoje',
      topBar: 'from-amber-400 to-yellow-500',
    },
  ]

  return {
    filterKey: `${params.entidadeId ?? 'all'}:${params.regionKey ?? 'all'}:${params.timelinePeriod ?? '24h'}`,
    unitRows,
    consultasLive,
    timeline: Array.from({ length: 8 }).map((_, idx) => ({
      hora: `${idx * 3}h`,
      emCurso: 8 + idx,
      concluidas: 12 + idx * 2,
      aguardando: Math.max(1, 6 - Math.floor(idx / 2)),
    })),
    rankingUbts: unitRows.slice(0, 6).map((row) => ({
      id: row.id,
      nome: row.ubt,
      municipio: row.prefeitura,
      municipioId: row.prefeituraId,
      hoje: row.emCurso + 6,
      ocupacao: row.ocupacao,
      performance: row.sla === 'normal' ? 'Ótima' : row.sla === 'atencao' ? 'Estável' : 'Crítica',
    })),
    rankingMunicipios: Array.from(entityMap.values()).map((entity, index) => ({
      id: entity.id,
      nome: entity.prefeitura,
      uf: entity.uf,
      hoje: 30 + index * 7,
      fila: 3 + (index % 4),
      ocupacao: 70 + (index % 20),
    })),
    heatmap: ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'].map((region) => ({
      regiao: region,
      slots: [2, 3, 4, 6, 5, 4, 3, 2],
    })),
    alerts: unitRows
      .filter((row) => row.sla !== 'normal')
      .slice(0, 5)
      .map((row) => ({
        id: `alert-${row.id}`,
        title: row.sla === 'critico' ? 'Unidade offline' : 'Fila em atenção',
        municipality: row.prefeitura,
        unit: row.ubt,
        severity: row.sla === 'critico' ? 'critical' : 'warning',
        timeAgo: 'há 5 min',
        category: row.sla === 'critico' ? 'Conectividade' : 'Fila',
        description:
          row.sla === 'critico'
            ? 'Sem terminais online para atendimento.'
            : 'Tempo médio de espera acima da meta.',
      })),
    queueSnapshot: {
      filaMedia: Math.round(unitRows.reduce((sum, row) => sum + row.fila, 0) / Math.max(1, unitRows.length)),
      filaMediaTrend: '-4% vs última hora',
      noShowHoje: 3,
      noShowTaxa: '2,4%',
    },
    filterOptions: {
      municipios: [{ value: 'all', label: 'Todas as prefeituras' }].concat(
        adminClientesRows.map((item) => ({ value: item.id, label: item.prefeitura })),
      ),
      regions: [
        { value: 'all', label: 'Todas as regiões' },
        { value: 'centro', label: 'Centro' },
        { value: 'norte', label: 'Norte' },
        { value: 'sul', label: 'Sul' },
        { value: 'leste', label: 'Leste' },
        { value: 'oeste', label: 'Oeste' },
      ],
      timelinePeriod: [
        { value: '24h', label: 'Últimas 24h' },
        { value: '7d', label: 'Últimos 7 dias' },
      ],
    },
    kpis,
  }
}

export async function fetchAdminMonitorOverview(
  _accessToken: string,
  params: AdminMonitorQueryParams = {},
) {
  return mockDelay(mapOverviewToMonitorPageData(buildOverview(params)), 70)
}

export async function fetchAdminMonitorConsultasLive(
  _accessToken: string,
  params: AdminMonitorQueryParams = {},
) {
  return mockDelay(clone(buildOverview(params).consultasLive), 60)
}

export async function fetchAdminMonitorAlertas(
  _accessToken: string,
  params: AdminMonitorQueryParams = {},
) {
  return mockDelay(clone(buildOverview(params).alerts), 60)
}
