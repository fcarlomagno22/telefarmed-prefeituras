import type { AppointmentStatus, DayAppointment } from './agendaMock'
import { getAgendaDayData } from './agendaMock'
import { parseDateKey, toDateKey } from '../utils/agendaDate'
import { computeAttendanceBreakdown } from '../utils/prefeituraAgendasAttendance'
import type { HeatmapCell, HeatmapUnitRow } from './prefeituraAgendasMock'

export type PrefeituraAgendaUnit = {
  id: string
  name: string
  regionKey: string
  regionLabel: string
}

export const prefeituraAgendaUnits: PrefeituraAgendaUnit[] = [
  {
    id: 'ubt-sao-francisco',
    name: 'UBT São Francisco',
    regionKey: 'centro',
    regionLabel: 'Centro',
  },
  {
    id: 'ubt-centro-historico',
    name: 'UBT Centro Histórico',
    regionKey: 'centro',
    regionLabel: 'Centro',
  },
  {
    id: 'ubt-asa-norte',
    name: 'UBT Asa Norte',
    regionKey: 'norte',
    regionLabel: 'Norte',
  },
  {
    id: 'ubt-norte-i',
    name: 'UBT Norte I',
    regionKey: 'norte',
    regionLabel: 'Norte',
  },
  {
    id: 'ubt-parque-sul',
    name: 'UBT Parque Sul',
    regionKey: 'sul',
    regionLabel: 'Sul',
  },
  {
    id: 'ubt-sul-ii',
    name: 'UBT Sul II',
    regionKey: 'sul',
    regionLabel: 'Sul',
  },
  {
    id: 'ubt-leste',
    name: 'UBT Leste',
    regionKey: 'leste',
    regionLabel: 'Leste',
  },
  {
    id: 'ubt-jardim-leste',
    name: 'UBT Jardim Leste',
    regionKey: 'leste',
    regionLabel: 'Leste',
  },
  {
    id: 'ubt-taguatinga',
    name: 'UBT Taguatinga',
    regionKey: 'oeste',
    regionLabel: 'Oeste',
  },
  {
    id: 'ubt-ceilandia',
    name: 'UBT Ceilândia',
    regionKey: 'oeste',
    regionLabel: 'Oeste',
  },
]

export type PrefeituraAgendaUnitId = string

export const prefeituraAgendaRegionOptions = [
  { value: 'centro', label: 'RA Centro' },
  { value: 'norte', label: 'RA Norte' },
  { value: 'sul', label: 'RA Sul' },
  { value: 'leste', label: 'RA Leste' },
  { value: 'oeste', label: 'RA Oeste' },
] as const

export const prefeituraAgendasUnitFilterOptions = [
  { value: 'todas', label: 'Todas as unidades' },
  ...prefeituraAgendaUnits.map((unit) => ({
    value: unit.id,
    label: unit.name,
  })),
]

const statusCycle: AppointmentStatus[] = [
  'realizado',
  'realizado',
  'faltou',
  'realizado',
  'aguardando',
  'agendado',
]

function hashUnitDay(unitId: string, dateKey: string, index: number) {
  let hash = 0
  const key = `${unitId}:${dateKey}:${index}`
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % 997
  }
  return hash
}

function varyStatus(
  base: AppointmentStatus,
  unitId: string,
  dateKey: string,
  index: number,
): AppointmentStatus {
  const unitOffset = prefeituraAgendaUnits.findIndex((unit) => unit.id === unitId)
  const variant = statusCycle[(hashUnitDay(unitId, dateKey, index) + unitOffset) % statusCycle.length]

  if (base === 'agendado') return base
  if (base === 'em_atendimento' || base === 'aguardando') {
    return index % 3 === unitOffset % 3 ? variant : base
  }

  return variant
}

export function findPrefeituraAgendaUnit(unitId: string): PrefeituraAgendaUnit {
  return (
    prefeituraAgendaUnits.find((unit) => unit.id === unitId) ?? prefeituraAgendaUnits[0]!
  )
}

export function formatPrefeituraAgendaUnitContext(unitId: string) {
  const unit = findPrefeituraAgendaUnit(unitId)
  return `RA ${unit.regionLabel} · ${unit.name}`
}

export function getPrefeituraAgendaUnitsByRegion(regionKey: string) {
  if (regionKey === 'todas') return [...prefeituraAgendaUnits]
  return prefeituraAgendaUnits.filter((unit) => unit.regionKey === regionKey)
}

export function getPrefeituraAgendaUnitOptions(regionKey: string) {
  return getPrefeituraAgendaUnitsByRegion(regionKey).map((unit) => ({
    value: unit.id,
    label: unit.name,
  }))
}

export function getPrefeituraUnitDayAppointments(
  unitId: PrefeituraAgendaUnitId,
  dateKey: string,
): DayAppointment[] {
  const date = parseDateKey(dateKey)
  const base = getAgendaDayData(date).appointments

  return base
    .map((appointment, index) => ({
      ...appointment,
      id: `${unitId}-${dateKey}-${appointment.id}`,
      status: varyStatus(appointment.status, unitId, dateKey, index),
    }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function buildHeatmapCell(
  unitId: PrefeituraAgendaUnitId,
  dateKey: string,
): HeatmapCell {
  const appointments = getPrefeituraUnitDayAppointments(unitId, dateKey)
  const { attended, noShows, attendancePercent } = computeAttendanceBreakdown(appointments)

  return {
    attendancePercent,
    attended,
    noShows,
    total: appointments.length,
  }
}

export function buildPrefeituraHeatmapRows(dayKeys: string[]): HeatmapUnitRow[] {
  return prefeituraAgendaUnits.map((unit) => ({
    id: unit.id,
    name: unit.name,
    cells: dayKeys.map((dayKey) => buildHeatmapCell(unit.id, dayKey)),
  }))
}

export function findPrefeituraUnitName(unitId: string) {
  return findPrefeituraAgendaUnit(unitId).name
}

/** Semana de agenda: domingo (início) até sábado (fim). */
export function getDefaultAgendasWeek(reference = new Date()) {
  const sunday = new Date(reference)
  sunday.setDate(reference.getDate() - reference.getDay())

  const keys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + index)
    return toDateKey(date)
  })

  return { start: keys[0]!, end: keys[6]!, dayKeys: keys }
}
