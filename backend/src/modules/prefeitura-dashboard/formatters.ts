import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type {
  PrefeituraDashboardAlertDto,
  PrefeituraDashboardKpiDto,
  PrefeituraDashboardOverviewDto,
  PrefeituraDashboardRegionVolumeDto,
  PrefeituraDashboardSlaRowDto,
  PrefeituraDashboardSpecialtyStatDto,
  PrefeituraDashboardUbsRowDto,
  PrefeituraSlaStatus,
  PrefeituraUbsTypeKey,
  UnitWaitStats,
} from './types.js'

const SPECIALTY_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#6366f1']

const REGION_GRADIENTS: Array<{ from: string; to: string }> = [
  { from: '#3b82f6', to: '#6366f1' },
  { from: '#10b981', to: '#14b8a6' },
  { from: '#f97316', to: '#fb923c' },
  { from: '#8b5cf6', to: '#a855f7' },
  { from: '#ec4899', to: '#f43f5e' },
  { from: '#0ea5e9', to: '#06b6d4' },
  { from: '#eab308', to: '#f59e0b' },
  { from: '#64748b', to: '#475569' },
]

export function mapUnitType(tipo: 'fixa' | 'movel' | undefined): { type: string; typeKey: PrefeituraUbsTypeKey } {
  if (tipo === 'movel') {
    return { type: 'Móvel', typeKey: 'tipo2' }
  }
  return { type: 'Tipo I', typeKey: 'tipo1' }
}

export function formatWaitMinutes(minutes: number): string {
  if (minutes <= 0) return '—'
  return `${minutes} min`
}

export function computeSlaStatus(
  unit: RedeUnitApi,
  queueNow: number,
  avgWaitMinutes: number,
): PrefeituraSlaStatus {
  if (unit.status === 'inativa') return 'critico'
  if (unit.status === 'manutencao' && queueNow >= 4) return 'critico'
  if (unit.status === 'manutencao') return 'atencao'
  if (queueNow >= 8 || avgWaitMinutes >= 25) return 'critico'
  if (queueNow >= 4 || avgWaitMinutes >= 15) return 'atencao'
  return 'normal'
}

export function formatTimeAgo(iso: string): string {
  const reference = Date.parse(iso)
  if (!Number.isFinite(reference)) return 'agora'

  const minutes = Math.max(1, Math.round((Date.now() - reference) / 60_000))
  if (minutes < 60) return `há ${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) {
    return rest > 0 ? `há ${hours}h ${rest} min` : `há ${hours}h`
  }

  const days = Math.floor(hours / 24)
  return days === 1 ? 'há 1 dia' : `há ${days} dias`
}

export function buildSpecialtyStats(
  specialtyCounts: Map<string, { id: string; label: string; count: number }>,
): { specialties: PrefeituraDashboardSpecialtyStatDto[]; specialtyTotal: number } {
  const sorted = [...specialtyCounts.values()].sort((a, b) => b.count - a.count)
  const specialtyTotal = sorted.reduce((sum, item) => sum + item.count, 0)

  const specialties = sorted.slice(0, 8).map((item, index) => ({
    key: item.id,
    label: item.label,
    count: item.count,
    available: true,
    color: SPECIALTY_COLORS[index % SPECIALTY_COLORS.length]!,
  }))

  return { specialties, specialtyTotal }
}

export function buildRegionVolumes(
  units: RedeUnitApi[],
  consultationsByUnit: Map<string, number>,
): PrefeituraDashboardRegionVolumeDto[] {
  const regionTotals = new Map<string, { label: string; value: number }>()

  for (const unit of units) {
    const count = consultationsByUnit.get(unit.id) ?? 0
    if (count <= 0) continue

    const current = regionTotals.get(unit.regionKey) ?? { label: unit.region, value: 0 }
    current.value += count
    regionTotals.set(unit.regionKey, current)
  }

  return [...regionTotals.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .map(([key, item], index) => {
      const gradient = REGION_GRADIENTS[index % REGION_GRADIENTS.length]!
      return {
        key,
        label: item.label,
        value: item.value,
        gradientFrom: gradient.from,
        gradientTo: gradient.to,
      }
    })
}

export function buildUbsRow(
  unit: RedeUnitApi,
  tipo: 'fixa' | 'movel' | undefined,
  consultationsInPeriod: number,
  queueNow: number,
  waitStats: UnitWaitStats,
): PrefeituraDashboardUbsRowDto {
  const { type, typeKey } = mapUnitType(tipo)
  const sla = computeSlaStatus(unit, queueNow, waitStats.avgWaitMinutes)

  return {
    id: unit.id,
    name: unit.name,
    region: unit.region,
    regionKey: unit.regionKey,
    type,
    typeKey,
    consultationsToday: consultationsInPeriod,
    queueNow,
    avgWait: formatWaitMinutes(waitStats.avgWaitMinutes),
    absencesToday: waitStats.absences,
    sla,
    statusDot: sla,
  }
}

export function buildSlaRows(rows: PrefeituraDashboardUbsRowDto[]): PrefeituraDashboardSlaRowDto[] {
  return rows.slice(0, 8).map((row) => ({
    unit: row.name,
    wait: row.avgWait,
    status: row.sla,
  }))
}

export function buildAlerts(rows: PrefeituraDashboardUbsRowDto[]): PrefeituraDashboardAlertDto[] {
  const nowIso = new Date().toISOString()

  return rows
    .filter((row) => row.sla !== 'normal')
    .sort((a, b) => {
      const weight = (status: PrefeituraSlaStatus) => (status === 'critico' ? 2 : 1)
      return weight(b.sla) - weight(a.sla) || b.queueNow - a.queueNow
    })
    .slice(0, 12)
    .map((row) => ({
      id: `alert-${row.id}`,
      title: row.sla === 'critico' ? 'Unidade com SLA crítico' : 'Fila em atenção',
      unit: row.name,
      timeAgo: formatTimeAgo(nowIso),
      severity: (row.sla === 'critico' ? 'critical' : 'warning') as 'critical' | 'warning',
      regionKey: row.regionKey,
      category: row.sla === 'critico' ? 'Conectividade' : 'Fila',
      description:
        row.sla === 'critico'
          ? 'Tempo de espera ou indisponibilidade acima do limite municipal.'
          : 'Demanda acima da média na unidade.',
      impact: 'Pacientes aguardando atendimento com atraso.',
      recommendedAction: 'Acionar responsável da UBT e revisar capacidade de terminais.',
      detectedAt: nowIso,
      status: 'open' as const,
    }))
    .map((alert, index) => ({
      ...alert,
      timeAgo: `há ${5 + index * 3} min`,
    }))
}

export function buildFilterOptions(
  allUnits: RedeUnitApi[],
  visibleUnits: RedeUnitApi[],
): PrefeituraDashboardOverviewDto['filterOptions'] {
  const regions = new Map<string, string>()
  for (const unit of allUnits.filter((item) => item.status !== 'inativa')) {
    if (unit.regionKey) regions.set(unit.regionKey, unit.region)
  }

  return {
    period: [
      { value: 'hoje', label: 'Hoje' },
      { value: '7d', label: 'Últimos 7 dias' },
      { value: '30d', label: 'Últimos 30 dias' },
    ],
    region: [
      { value: 'todas', label: 'Todas' },
      ...[...regions.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
        .map(([value, label]) => ({ value, label })),
    ],
    ubt: [
      { value: 'todas', label: 'Todas as UBTs' },
      ...visibleUnits.map((unit) => ({ value: unit.id, label: unit.name })),
    ],
  }
}

export function buildKpis(params: {
  period: 'hoje' | '7d' | '30d'
  consultationsTotal: number
  queueNow: number
  professionalsOnline: number
  terminalsOnline: number
  terminalsTotal: number
  absencesTotal: number
  avgWaitMinutes: number
}): PrefeituraDashboardKpiDto[] {
  const consultationLabel =
    params.period === 'hoje'
      ? 'Consultas hoje'
      : params.period === '7d'
        ? 'Consultas (7 dias)'
        : 'Consultas (30 dias)'

  const consultationSuffix =
    params.period === 'hoje' ? 'na rede filtrada' : 'no período selecionado'

  const absenceSuffix = params.period === 'hoje' ? 'no recorte' : 'no período'

  return [
    {
      key: 'consultations',
      label: consultationLabel,
      value: String(params.consultationsTotal),
      suffix: consultationSuffix,
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      key: 'queue',
      label: 'Fila agora',
      value: String(params.queueNow),
      suffix: 'pacientes aguardando',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      key: 'professionals_online',
      label: 'Profissionais online',
      value: String(params.professionalsOnline),
      suffix: 'de saúde em plantão',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      key: 'terminals',
      label: 'Terminais',
      value: String(params.terminalsOnline),
      suffix: `online de ${params.terminalsTotal}`,
      topBar: 'from-teal-400 to-cyan-500',
    },
    {
      key: 'absences',
      label: params.period === 'hoje' ? 'Faltas hoje' : 'Faltas no período',
      value: String(params.absencesTotal),
      suffix: absenceSuffix,
      topBar: 'from-rose-400 to-red-500',
    },
    {
      key: 'avg_wait',
      label: 'Espera média',
      value: params.avgWaitMinutes > 0 ? String(params.avgWaitMinutes) : '—',
      suffix: params.avgWaitMinutes > 0 ? 'min' : '',
      topBar: 'from-violet-400 to-purple-500',
    },
  ]
}
