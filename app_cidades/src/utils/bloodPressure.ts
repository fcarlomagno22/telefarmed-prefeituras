import {
  BloodPressureHistoryEntry,
  BloodPressureTarget,
  BloodPressureTimeSlot,
  BloodPressureZoneLabel,
} from '../types/bloodPressure'

export const DEFAULT_BLOOD_PRESSURE_TARGET: BloodPressureTarget = {
  systolic: 140,
  diastolic: 90,
}

export type BloodPressureZone = {
  label: BloodPressureZoneLabel
  color: string
  bg: string
  border: string
}

export const BLOOD_PRESSURE_TIME_SLOT_LABELS: Record<BloodPressureTimeSlot, string> = {
  morning: 'Manhã (6h–11h)',
  afternoon: 'Tarde (12h–17h)',
  evening: 'Noite (18h–21h)',
  night: 'Madrugada (22h–5h)',
}

export const BLOOD_PRESSURE_TIME_SLOT_SHORT_LABELS: Record<BloodPressureTimeSlot, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
  night: 'Madrugada',
}

export function getBloodPressureZone(systolic: number, diastolic: number): BloodPressureZone {
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Alta',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (systolic >= 130 || diastolic >= 80 || systolic >= 120) {
    return {
      label: 'Elevada',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(251, 191, 36, 0.35)',
    }
  }

  return {
    label: 'Normal',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
  }
}

export function formatBloodPressureValue(systolic: number, diastolic: number) {
  return `${Math.round(systolic)}/${Math.round(diastolic)} mmHg`
}

export function formatBloodPressureShort(systolic: number, diastolic: number) {
  return `${Math.round(systolic)}/${Math.round(diastolic)}`
}

export function formatBloodPressureDateTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBloodPressureTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function isBloodPressureInTarget(
  systolic: number,
  diastolic: number,
  target: BloodPressureTarget = DEFAULT_BLOOD_PRESSURE_TARGET,
) {
  return systolic < target.systolic && diastolic < target.diastolic
}

export function isBloodPressureAboveTarget(
  systolic: number,
  diastolic: number,
  target: BloodPressureTarget = DEFAULT_BLOOD_PRESSURE_TARGET,
) {
  return systolic >= target.systolic || diastolic >= target.diastolic
}

export function getBloodPressureTimeSlot(iso: string): BloodPressureTimeSlot {
  const hour = new Date(iso).getHours()
  if (hour >= 6 && hour <= 11) return 'morning'
  if (hour >= 12 && hour <= 17) return 'afternoon'
  if (hour >= 18 && hour <= 21) return 'evening'
  return 'night'
}

export function sortBloodPressureHistory(entries: BloodPressureHistoryEntry[]) {
  return [...entries].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )
}

export function filterBloodPressureHistoryByPeriod(
  entries: BloodPressureHistoryEntry[],
  start: Date,
  end: Date,
) {
  const startMs = start.getTime()
  const endMs = end.getTime()

  return entries.filter((entry) => {
    const timestamp = new Date(entry.recordedAt).getTime()
    return timestamp >= startMs && timestamp <= endMs
  })
}
