import type {
  ConsultasGenderSlice,
  ConsultasSpecialtySlice,
  ConsultasStatusSlice,
  ConsultasSummary,
  ConsultationRecord,
} from '../../data/consultasMock'
import {
  applyConsultasFilters,
  defaultConsultasFilters,
  type ConsultasFilters,
} from '../consultasFilters'

export type ConsultasOverviewSnapshot = {
  summary: ConsultasSummary
  avgDurationMinutes: number | null
  statusDistribution: ConsultasStatusSlice[]
  specialtyDistribution: ConsultasSpecialtySlice[]
  genderDistribution: ConsultasGenderSlice[]
}

const STATUS_META: Array<
  Pick<ConsultasStatusSlice, 'key' | 'label' | 'color' | 'gradientFrom' | 'gradientTo'>
> = [
  {
    key: 'concluida',
    label: 'Concluídas',
    color: '#10b981',
    gradientFrom: '#34d399',
    gradientTo: '#059669',
  },
  {
    key: 'cancelada',
    label: 'Canceladas',
    color: '#ef4444',
    gradientFrom: '#fb7185',
    gradientTo: '#dc2626',
  },
  {
    key: 'em_andamento',
    label: 'Em andamento',
    color: '#3b82f6',
    gradientFrom: '#60a5fa',
    gradientTo: '#2563eb',
  },
]

const GENDER_META: Array<
  Pick<
    ConsultasGenderSlice,
    'key' | 'label' | 'shortLabel' | 'gradientFrom' | 'gradientTo'
  >
> = [
  {
    key: 'feminino',
    label: 'Feminino',
    shortLabel: 'Fem.',
    gradientFrom: '#f9a8d4',
    gradientTo: '#db2777',
  },
  {
    key: 'masculino',
    label: 'Masculino',
    shortLabel: 'Masc.',
    gradientFrom: '#93c5fd',
    gradientTo: '#2563eb',
  },
]

function periodFilters(periodStart: string, periodEnd: string): ConsultasFilters {
  return {
    ...defaultConsultasFilters,
    periodStart,
    periodEnd,
  }
}

export function filterConsultasByPeriod(
  records: ConsultationRecord[],
  periodStart: string,
  periodEnd: string,
): ConsultationRecord[] {
  return applyConsultasFilters(records, periodFilters(periodStart, periodEnd))
}

function computeSummary(records: ConsultationRecord[]): ConsultasSummary {
  let completed = 0
  let cancelled = 0
  let inProgress = 0

  for (const record of records) {
    if (record.status === 'concluida') completed += 1
    else if (record.status === 'cancelada') cancelled += 1
    else if (record.status === 'em_andamento') inProgress += 1
  }

  return {
    total: records.length,
    completed,
    cancelled,
    inProgress,
  }
}

function computeAvgDurationMinutes(records: ConsultationRecord[]): number | null {
  const durations = records
    .filter((record) => record.status === 'concluida' && record.durationMinutes !== null)
    .map((record) => record.durationMinutes as number)

  if (durations.length === 0) return null

  const total = durations.reduce((sum, value) => sum + value, 0)
  return Math.round(total / durations.length)
}

function computeStatusDistribution(
  records: ConsultationRecord[],
  total: number,
): ConsultasStatusSlice[] {
  const counts: Record<ConsultasStatusSlice['key'], number> = {
    concluida: 0,
    cancelada: 0,
    em_andamento: 0,
  }

  for (const record of records) {
    counts[record.status] += 1
  }

  return STATUS_META.map((meta) => ({
    ...meta,
    count: counts[meta.key],
    percent: total > 0 ? Math.round((counts[meta.key] / total) * 1000) / 10 : 0,
  }))
}

function computeSpecialtyDistribution(
  records: ConsultationRecord[],
  total: number,
): ConsultasSpecialtySlice[] {
  const counts = new Map<string, number>()

  for (const record of records) {
    counts.set(record.specialty, (counts.get(record.specialty) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
}

function computeGenderDistribution(
  records: ConsultationRecord[],
  total: number,
): ConsultasGenderSlice[] {
  const counts = { F: 0, M: 0 }

  for (const record of records) {
    counts[record.gender] += 1
  }

  return GENDER_META.map((meta) => {
    const count = meta.key === 'feminino' ? counts.F : counts.M
    return {
      ...meta,
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }
  })
}

export function computeConsultasOverviewSnapshot(
  records: ConsultationRecord[],
  periodStart: string,
  periodEnd: string,
): ConsultasOverviewSnapshot {
  const filtered = filterConsultasByPeriod(records, periodStart, periodEnd)
  const summary = computeSummary(filtered)
  const total = summary.total

  return {
    summary,
    avgDurationMinutes: computeAvgDurationMinutes(filtered),
    statusDistribution: computeStatusDistribution(filtered, total),
    specialtyDistribution: computeSpecialtyDistribution(filtered, total),
    genderDistribution: computeGenderDistribution(filtered, total),
  }
}
