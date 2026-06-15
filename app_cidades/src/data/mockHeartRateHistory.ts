import { HeartRateContext, HeartRateReading } from '../types/heartRate'
import { IntegrationConnectionState } from '../types/healthIntegrations'
import { sortHeartRateReadings } from '../utils/heartRate'

export {
  formatHeartRateTime,
  getHeartRateContextLabel,
  getHeartRateZone,
  summarizeHeartRate,
} from '../utils/heartRate'

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function buildReading(
  dayOffset: number,
  hour: number,
  minute: number,
  bpm: number,
  source: HeartRateReading['source'],
  context: HeartRateContext,
): HeartRateReading {
  const recordedAt = startOfDay(new Date())
  recordedAt.setDate(recordedAt.getDate() - dayOffset)
  recordedAt.setHours(hour, minute, 0, 0)

  return {
    id: `${source}-${context}-${dayOffset}-${hour}-${minute}-${bpm}`,
    bpm,
    recordedAt,
    source,
    context,
  }
}

function buildTodayReading(
  hoursAgo: number,
  minutesOffset: number,
  bpm: number,
  source: HeartRateReading['source'],
  context: HeartRateContext,
): HeartRateReading {
  const recordedAt = new Date()
  recordedAt.setHours(recordedAt.getHours() - hoursAgo, recordedAt.getMinutes() - minutesOffset, 0, 0)

  return {
    id: `${source}-${context}-${hoursAgo}-${minutesOffset}-${bpm}`,
    bpm,
    recordedAt,
    source,
    context,
  }
}

export function createMockHeartRateHistory(): HeartRateReading[] {
  return sortHeartRateReadings([
    buildTodayReading(0, 18, 74, 'Apple Health', 'resting'),
    buildTodayReading(1, 5, 88, 'Apple Health', 'workout'),
    buildTodayReading(2, 40, 71, 'Apple Health', 'resting'),
    buildTodayReading(4, 12, 96, 'Galaxy Watch', 'workout'),
    buildTodayReading(6, 0, 58, 'Apple Health', 'sleep'),
    buildTodayReading(7, 30, 62, 'Apple Health', 'sleep'),
    buildTodayReading(9, 10, 69, 'Apple Health', 'resting'),
    buildTodayReading(11, 22, 104, 'Galaxy Watch', 'workout'),
    buildTodayReading(13, 8, 76, 'Apple Health', 'resting'),
  ])
}

export function createExtendedMockHeartRateHistory(days = 45): HeartRateReading[] {
  const readings: HeartRateReading[] = []
  const sources: HeartRateReading['source'][] = ['Apple Health', 'Galaxy Watch', 'Health Connect']

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const seed = dayOffset + 17
    const source = sources[Math.floor(seededNoise(seed) * sources.length)]
    const isActiveDay = seededNoise(seed + 1) > 0.45

    readings.push(
      buildReading(dayOffset, 6, 20, 56 + Math.round(seededNoise(seed + 2) * 8), source, 'sleep'),
      buildReading(dayOffset, 7, 45, 58 + Math.round(seededNoise(seed + 3) * 10), source, 'sleep'),
      buildReading(
        dayOffset,
        9,
        5,
        64 + Math.round(seededNoise(seed + 4) * 12),
        source,
        'resting',
      ),
      buildReading(
        dayOffset,
        14,
        10,
        68 + Math.round(seededNoise(seed + 5) * 10),
        source,
        'resting',
      ),
    )

    if (isActiveDay) {
      const workoutBpm =
        92 +
        Math.round(seededNoise(seed + 6) * 38) +
        (seededNoise(seed + 7) > 0.82 ? 18 : 0)
      readings.push(
        buildReading(dayOffset, 18, 15, workoutBpm, source, 'workout'),
        buildReading(
          dayOffset,
          18,
          45,
          Math.max(78, workoutBpm - 12 - Math.round(seededNoise(seed + 8) * 8)),
          source,
          'workout',
        ),
      )
    } else if (seededNoise(seed + 9) > 0.78) {
      readings.push(
        buildReading(
          dayOffset,
          16,
          30,
          102 + Math.round(seededNoise(seed + 10) * 16),
          source,
          'workout',
        ),
      )
    }
  }

  return sortHeartRateReadings(readings)
}

export function registerHeartRateInHistory(
  history: HeartRateReading[],
  reading: HeartRateReading,
) {
  const withoutDuplicate = history.filter((entry) => entry.id !== reading.id)
  return sortHeartRateReadings([reading, ...withoutDuplicate])
}

export function hasHeartRateIntegration(
  connections: Record<string, IntegrationConnectionState>,
): boolean {
  return Object.values(connections).some(
    (connection) =>
      connection.status === 'connected' &&
      connection.enabledPermissions?.includes('heart-rate'),
  )
}

export function createManualHeartRateReading(bpm: number): HeartRateReading {
  return {
    id: `manual-${Date.now()}`,
    bpm,
    recordedAt: new Date(),
    source: 'Manual',
    context: 'manual',
  }
}
