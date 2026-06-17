import type { SleepLogDraft, SleepLogEntry, SleepQualityScore } from '../types/sleepLog'
import { toLocalDateIso } from './runWalkWeeklyChart'

const QUALITY_LABELS: Record<SleepQualityScore, string> = {
  1: 'Muito mal',
  2: 'Mal',
  3: 'Regular',
  4: 'Bem',
  5: 'Muito bem',
}

export function getSleepQualityLabel(score: SleepQualityScore) {
  return QUALITY_LABELS[score]
}

export function formatSleepTimeMinutes(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function formatSleepDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes} min`
  if (minutes <= 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function formatSleepLogDateLabel(dateIso: string) {
  const date = parseSleepDateIso(dateIso)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatSleepLogShortDateLabel(dateIso: string) {
  const date = parseSleepDateIso(dateIso)
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
}

export function parseSleepDateIso(dateIso: string) {
  return new Date(`${dateIso}T12:00:00`)
}

export function shiftSleepDateIso(dateIso: string, deltaDays: number) {
  const date = parseSleepDateIso(dateIso)
  date.setDate(date.getDate() + deltaDays)
  return toLocalDateIso(date)
}

export function clampSleepTimeMinutes(value: number) {
  return Math.min(23 * 60 + 59, Math.max(0, value))
}

export function adjustSleepTimeMinutes(value: number, deltaMinutes: number) {
  return clampSleepTimeMinutes(value + deltaMinutes)
}

export function getDefaultSleepLogDraft(referenceDate = new Date()): SleepLogDraft {
  const today = new Date(referenceDate)
  today.setHours(12, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  return {
    bedDateIso: toLocalDateIso(yesterday),
    bedTimeMinutes: 22 * 60 + 30,
    wakeTimeMinutes: 7 * 60,
    quality: 3,
    wakeCount: 0,
    notes: '',
  }
}

export function buildSleepLogEntryFromDraft(draft: SleepLogDraft): SleepLogEntry {
  const wakeDateIso =
    draft.wakeTimeMinutes <= draft.bedTimeMinutes
      ? shiftSleepDateIso(draft.bedDateIso, 1)
      : draft.bedDateIso

  const bedDateTime = parseSleepDateIso(draft.bedDateIso)
  bedDateTime.setHours(
    Math.floor(draft.bedTimeMinutes / 60),
    draft.bedTimeMinutes % 60,
    0,
    0,
  )

  const wakeDateTime = parseSleepDateIso(wakeDateIso)
  wakeDateTime.setHours(
    Math.floor(draft.wakeTimeMinutes / 60),
    draft.wakeTimeMinutes % 60,
    0,
    0,
  )

  const durationMinutes = Math.max(
    1,
    Math.round((wakeDateTime.getTime() - bedDateTime.getTime()) / 60000),
  )

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bedDateIso: draft.bedDateIso,
    bedTimeMinutes: draft.bedTimeMinutes,
    wakeDateIso,
    wakeTimeMinutes: draft.wakeTimeMinutes,
    durationMinutes,
    quality: draft.quality,
    wakeCount: draft.wakeCount,
    notes: draft.notes.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
}

export function isFutureSleepDateIso(dateIso: string, referenceDate = new Date()) {
  const date = parseSleepDateIso(dateIso)
  const today = new Date(referenceDate)
  today.setHours(23, 59, 59, 999)
  return date.getTime() > today.getTime()
}
