import {
  CalendarDays,
  CheckCircle2,
  Percent,
  UserX,
} from 'lucide-react'
export type PrefeituraAgendasFuturePeriodId = '7d' | '30d'

export type AttendanceLevel = 'low' | 'medium' | 'high' | 'excellent'

export type HeatmapDayColumn = {
  key: string
  weekdayShort: string
  dateLabel: string
}

export type HeatmapCell = {
  attendancePercent: number
  attended: number
  noShows: number
  total: number
}

export type HeatmapUnitRow = {
  id: string
  name: string
  cells: HeatmapCell[]
}

export type AttendanceRow = {
  id: string
  label: string
  attended: number
  absences: number
  absenceRate: number
}

export type HighlightItem = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type FutureAppointmentsSummary = {
  total: number
  dailyAverage: number
  busiestDay: string
  busiestCount: number
  quietestDay: string
  quietestCount: number
  confirmed: number
  pendingConfirmation: number
  firstVisits: number
  returnVisits: number
  topUnit: string
  topUnitBookings: number
  peakHour: string
  occupancyForecastPercent: number
}

export { prefeituraAgendasUnitFilterOptions } from './prefeituraAgendasScheduleMock'

const weekdayShort = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

export function buildPrefeituraAgendasHeatmapDays(dayKeys: string[]): HeatmapDayColumn[] {
  return dayKeys.map((key) => {
    const date = new Date(
      Number(key.slice(0, 4)),
      Number(key.slice(5, 7)) - 1,
      Number(key.slice(8, 10)),
    )
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return {
      key,
      weekdayShort: weekdayShort[date.getDay()]!,
      dateLabel: `${day}/${month}`,
    }
  })
}

export const prefeituraAgendasWeeklySummary = [
  {
    label: 'Agendamentos',
    value: '2.856',
    suffix: 'agendamentos na rede',
    icon: CalendarDays,
    iconClass: 'from-orange-500 via-amber-500 to-orange-600',
    ringClass: 'ring-orange-100/80',
    shadowClass: 'shadow-[0_6px_16px_rgba(249,115,22,0.3)]',
  },
  {
    label: 'Comparecimentos',
    value: '2.124',
    suffix: 'consultas com presença confirmada',
    icon: CheckCircle2,
    iconClass: 'from-emerald-500 via-green-500 to-teal-600',
    ringClass: 'ring-emerald-100/80',
    shadowClass: 'shadow-[0_6px_16px_rgba(16,185,129,0.3)]',
  },
  {
    label: 'Taxa comparecimento',
    value: '74%',
    suffix: 'média entre as UBTs',
    icon: Percent,
    iconClass: 'from-sky-500 via-blue-500 to-indigo-600',
    ringClass: 'ring-blue-100/80',
    shadowClass: 'shadow-[0_6px_16px_rgba(59,130,246,0.3)]',
  },
  {
    label: 'Faltas',
    value: '732',
    suffix: 'pacientes não compareceram',
    icon: UserX,
    iconClass: 'from-rose-500 via-red-500 to-red-600',
    ringClass: 'ring-red-100/80',
    shadowClass: 'shadow-[0_6px_16px_rgba(239,68,68,0.3)]',
  },
] as const

export const prefeituraAgendasAttendanceByUbs: AttendanceRow[] = [
  { id: 'ubt-sao-francisco', label: 'UBT São Francisco', attended: 198, absences: 42, absenceRate: 17 },
  { id: 'ubt-centro-historico', label: 'UBT Centro Histórico', attended: 214, absences: 56, absenceRate: 21 },
  { id: 'ubt-asa-norte', label: 'UBT Asa Norte', attended: 185, absences: 48, absenceRate: 21 },
  { id: 'ubt-norte-i', label: 'UBT Norte I', attended: 200, absences: 64, absenceRate: 24 },
  { id: 'ubt-parque-sul', label: 'UBT Parque Sul', attended: 210, absences: 38, absenceRate: 15 },
  { id: 'ubt-sul-ii', label: 'UBT Sul II', attended: 188, absences: 48, absenceRate: 20 },
  { id: 'ubt-leste', label: 'UBT Leste', attended: 176, absences: 44, absenceRate: 20 },
  { id: 'ubt-jardim-leste', label: 'UBT Jardim Leste', attended: 180, absences: 50, absenceRate: 22 },
  { id: 'ubt-taguatinga', label: 'UBT Taguatinga', attended: 292, absences: 98, absenceRate: 25 },
  { id: 'ubt-ceilandia', label: 'UBT Ceilândia', attended: 281, absences: 244, absenceRate: 33 },
  { id: 'ubt-oeste', label: 'UBT Oeste', attended: 165, absences: 52, absenceRate: 24 },
]

export const prefeituraAgendasHighlights: HighlightItem[] = [
  {
    id: 'low-attendance',
    title: 'Menor Comparecimento',
    subtitle: 'UBT Oeste (SEG) — 62% na semana',
    tone: 'red',
  },
  {
    id: 'high-attendance',
    title: 'Maior Comparecimento',
    subtitle: 'UBT Sul (QUI) — 91% na semana',
    tone: 'green',
  },
  {
    id: 'absences',
    title: 'Maior Taxa de Faltas',
    subtitle: 'UBT Oeste (29% de faltas)',
    tone: 'amber',
  },
  {
    id: 'performance',
    title: 'Melhor Desempenho',
    subtitle: 'UBT Sul (82% comparecimento)',
    tone: 'blue',
  },
]

export const prefeituraAgendasFuture7Days: FutureAppointmentsSummary = {
  total: 2856,
  dailyAverage: 408,
  busiestDay: 'Terça, 20/05',
  busiestCount: 648,
  quietestDay: 'Domingo, 25/05',
  quietestCount: 76,
  confirmed: 2418,
  pendingConfirmation: 438,
  firstVisits: 924,
  returnVisits: 1932,
  topUnit: 'UBT Taguatinga',
  topUnitBookings: 412,
  peakHour: '10h – 11h',
  occupancyForecastPercent: 68,
}

export const prefeituraAgendasFuture30Days: FutureAppointmentsSummary = {
  total: 11240,
  dailyAverage: 375,
  busiestDay: 'Quarta, 21/05',
  busiestCount: 512,
  quietestDay: 'Domingo, 25/05',
  quietestCount: 68,
  confirmed: 9864,
  pendingConfirmation: 1376,
  firstVisits: 3180,
  returnVisits: 8060,
  topUnit: 'UBT São Francisco',
  topUnitBookings: 1486,
  peakHour: '09h – 10h',
  occupancyForecastPercent: 72,
}

export function getAttendanceLevel(percent: number): AttendanceLevel {
  if (percent >= 81) return 'excellent'
  if (percent >= 61) return 'high'
  if (percent >= 41) return 'medium'
  return 'low'
}

export function filterHeatmapRows(
  rows: HeatmapUnitRow[],
  unitFilter: string,
): HeatmapUnitRow[] {
  if (unitFilter === 'todas') return rows
  return rows.filter((row) => row.id === unitFilter)
}
