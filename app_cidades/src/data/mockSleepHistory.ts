import type { SleepLogEntry, SleepQualityScore } from '../types/sleepLog'
import { parseSleepDateIso, shiftSleepDateIso } from '../utils/sleepLogFormat'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const MOCK_NOTES = [
  'Dormi bem, acordei descansado.',
  'Acordei uma vez para beber água.',
  'Demorei um pouco para pegar no sono.',
  'Noite tranquila com chuva.',
  'Dormi tarde, mas rendeu.',
  'Acordei cedo para exercício.',
] as const

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function buildMockSleepEntry(wakeDateIso: string, seed: number): SleepLogEntry {
  const bedHour = 22 + Math.floor(seededNoise(seed) * 2)
  const bedMinute = Math.floor(seededNoise(seed + 1) * 4) * 15
  const bedTimeMinutes = bedHour * 60 + bedMinute

  const wakeHour = 6 + Math.floor(seededNoise(seed + 2) * 2)
  const wakeMinute = Math.floor(seededNoise(seed + 3) * 4) * 15
  const wakeTimeMinutes = wakeHour * 60 + wakeMinute

  const bedDateIso = shiftSleepDateIso(wakeDateIso, -1)

  const bedDateTime = parseSleepDateIso(bedDateIso)
  bedDateTime.setHours(Math.floor(bedTimeMinutes / 60), bedTimeMinutes % 60, 0, 0)

  const wakeDateTime = parseSleepDateIso(wakeDateIso)
  wakeDateTime.setHours(Math.floor(wakeTimeMinutes / 60), wakeTimeMinutes % 60, 0, 0)

  const durationMinutes = Math.max(
    1,
    Math.round((wakeDateTime.getTime() - bedDateTime.getTime()) / 60000),
  )

  const quality = Math.min(5, Math.max(2, 2 + Math.floor(seededNoise(seed + 4) * 4))) as SleepQualityScore
  const wakeCount = Math.floor(seededNoise(seed + 5) * 4)
  const includeNote = seededNoise(seed + 6) > 0.55
  const noteIndex = Math.floor(seededNoise(seed + 7) * MOCK_NOTES.length)

  const createdAt = new Date(wakeDateTime)
  createdAt.setHours(createdAt.getHours() + 1)

  return {
    id: `mock-sleep-${wakeDateIso}-${seed}`,
    bedDateIso,
    bedTimeMinutes,
    wakeDateIso,
    wakeTimeMinutes,
    durationMinutes,
    quality,
    wakeCount,
    notes: includeNote ? MOCK_NOTES[noteIndex] : undefined,
    createdAt: createdAt.toISOString(),
  }
}

export function createMockSleepHistory(days = 45): SleepLogEntry[] {
  const entries: SleepLogEntry[] = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    if (dayOffset === 0 && seededNoise(dayOffset + 200) > 0.35) {
      continue
    }

    if (dayOffset > 0 && seededNoise(dayOffset + 100) < 0.1) {
      continue
    }

    const wakeDate = new Date(today)
    wakeDate.setDate(today.getDate() - dayOffset)
    const wakeDateIso = toLocalDateIso(wakeDate)

    entries.push(buildMockSleepEntry(wakeDateIso, dayOffset + 1))
  }

  return entries.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}
