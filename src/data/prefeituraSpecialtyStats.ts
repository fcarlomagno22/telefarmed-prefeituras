import { specialties } from './specialties'

export type PrefeituraSpecialtyStat = {
  key: string
  label: string
  count: number
  available: boolean
  color: string
}

/** Contagens mock por id — mesmas especialidades do fluxo de triagem (`specialties.ts`). */
const consultationCountBySpecialtyId: Record<string, number> = {
  '4': 492,
  '3': 292,
  '7': 230,
  '14': 132,
  '15': 18,
  '113': 9,
  '16': 108,
  '18': 72,
  '19': 142,
  '244': 34,
  '339': 6,
  '200': 4,
  '179': 168,
  '26': 94,
  '337': 68,
  '187': 14,
  '34': 16,
  '132': 118,
  '29': 78,
  '33': 124,
  '32': 22,
  '37': 19,
  '38': 88,
}

const specialtyChartColors = [
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#6366f1',
  '#14b8a6',
  '#f43f5e',
  '#84cc16',
  '#a855f7',
  '#0ea5e9',
  '#22c55e',
  '#fb923c',
  '#64748b',
  '#d946ef',
  '#2dd4bf',
  '#ef4444',
  '#4ade80',
  '#f59e0b',
  '#818cf8',
  '#34d399',
  '#c026d3',
] as const

export const prefeituraSpecialtyStats: PrefeituraSpecialtyStat[] = specialties.map(
  (specialty, index) => ({
    key: specialty.id,
    label: specialty.name,
    count: consultationCountBySpecialtyId[specialty.id] ?? 0,
    available: specialty.available,
    color: specialtyChartColors[index % specialtyChartColors.length],
  }),
)

export const prefeituraSpecialtyTotal = prefeituraSpecialtyStats.reduce(
  (sum, item) => sum + item.count,
  0,
)
