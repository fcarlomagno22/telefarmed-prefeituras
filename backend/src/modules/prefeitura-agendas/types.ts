import type { DayAppointmentDto } from '../ubt-agenda/types.js'

export type PrefeituraAgendaUnitDto = {
  id: string
  name: string
  regionKey: string
  regionLabel: string
}

export type PrefeituraAgendaCatalogDto = {
  units: PrefeituraAgendaUnitDto[]
  regionOptions: Array<{ value: string; label: string }>
  unitFilterOptions: Array<{ value: string; label: string }>
}

export type HeatmapCellDto = {
  attendancePercent: number
  attended: number
  noShows: number
  total: number
}

export type HeatmapUnitRowDto = {
  id: string
  name: string
  cells: HeatmapCellDto[]
}

export type AttendanceRowDto = {
  id: string
  label: string
  attended: number
  absences: number
  absenceRate: number
}

export type HighlightItemDto = {
  id: string
  title: string
  subtitle: string
  tone: 'red' | 'green' | 'amber' | 'blue'
}

export type PrefeituraAgendaWeekDto = {
  weekStart: string
  weekEnd: string
  heatmapRows: HeatmapUnitRowDto[]
  weeklySummary: {
    totalAppointments: number
    attended: number
    attendanceRatePercent: number
    noShows: number
  }
  attendanceByUnit: AttendanceRowDto[]
  highlights: HighlightItemDto[]
}

export type PrefeituraAgendaDayDto = {
  date: string
  unitId: string
  appointments: DayAppointmentDto[]
  breakdown: {
    attended: number
    noShows: number
    attendancePercent: number
  }
}

export type FutureAppointmentsSummaryDto = {
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

export type AgendaAggregateRow = {
  unidade_ubt_id: string
  data: string
  hora: string
  status: string
  tipo: string
  telefone_contato: string | null
  especialidade_id: string
  origem: string
  escala_slot_id: string | null
}
