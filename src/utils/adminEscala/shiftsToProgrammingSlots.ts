import { specialties } from '../../data/specialties'
import type { AdminEscalaProgrammingSlot, AdminEscalaShift } from '../../types/adminEscala'
import type { AdminEscalaWeekday } from './buildClosedSchedule'

function toDateInputValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeInputValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '08:00'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function slotSignature(shift: AdminEscalaShift) {
  const specialtyId =
    shift.specialtyId ?? specialties.find((s) => s.name === shift.specialty)?.id ?? ''
  return [
    specialtyId,
    shift.assignmentMode,
    shift.primaryDoctorId,
    String(shift.vacancies),
    String(shift.amountCents),
    toTimeInputValue(shift.startAt),
    toTimeInputValue(shift.endAt),
    shift.modality,
    shift.backupDoctorIds.join(','),
    shift.notes,
  ].join('|')
}

/** Reconstrói blocos de programação a partir de plantões de um batch (edição). */
export function shiftsToProgrammingSlots(shifts: AdminEscalaShift[]): {
  rangeStart: string
  rangeEnd: string
  slots: AdminEscalaProgrammingSlot[]
} {
  if (shifts.length === 0) {
    return { rangeStart: '', rangeEnd: '', slots: [] }
  }

  const sorted = [...shifts].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )

  const rangeStart = toDateInputValue(sorted[0].startAt)
  const rangeEnd = toDateInputValue(sorted[sorted.length - 1].startAt)

  const groups = new Map<
    string,
    {
      specialtyId: string
      assignmentMode: AdminEscalaShift['assignmentMode']
      primaryDoctorId: string
      dailyStart: string
      dailyEnd: string
      modality: AdminEscalaShift['modality']
      backupDoctorIds: string[]
      vacancies: number
      amountCents: number
      unitName: string
      city: string
      cityUf: string
      fullAddress: string | null
      notes: string
      weekdays: Set<AdminEscalaWeekday>
    }
  >()

  for (const shift of sorted) {
    const sig = slotSignature(shift)
    const specialtyId =
      shift.specialtyId ?? specialties.find((s) => s.name === shift.specialty)?.id ?? ''
    const weekday = new Date(shift.startAt).getDay() as AdminEscalaWeekday

    const existing = groups.get(sig)
    if (existing) {
      existing.weekdays.add(weekday)
      continue
    }

    groups.set(sig, {
      specialtyId,
      assignmentMode: shift.assignmentMode,
      primaryDoctorId: shift.primaryDoctorId,
      dailyStart: toTimeInputValue(shift.startAt),
      dailyEnd: toTimeInputValue(shift.endAt),
      modality: shift.modality,
      backupDoctorIds: [...shift.backupDoctorIds],
      vacancies: shift.totalVacancies || shift.vacancies,
      amountCents: shift.amountCents,
      unitName: shift.unitName,
      city: shift.city,
      cityUf: shift.cityUf,
      fullAddress: shift.fullAddress,
      notes: shift.notes,
      weekdays: new Set([weekday]),
    })
  }

  const slots: AdminEscalaProgrammingSlot[] = [...groups.values()].map((group, index) => ({
    id: `slot-edit-${index}`,
    specialtyId: group.specialtyId,
    dailyStart: group.dailyStart,
    dailyEnd: group.dailyEnd,
    weekdays: [...group.weekdays].sort() as AdminEscalaWeekday[],
    modality: group.modality,
    assignmentMode: group.assignmentMode,
    primaryDoctorId: group.primaryDoctorId,
    backupDoctorIds: group.backupDoctorIds,
    vacancies: group.vacancies,
    amountCents: group.amountCents,
    unitName: group.unitName,
    city: group.city,
    cityUf: group.cityUf,
    fullAddress: group.fullAddress,
    notes: group.notes,
  }))

  return { rangeStart, rangeEnd, slots }
}
