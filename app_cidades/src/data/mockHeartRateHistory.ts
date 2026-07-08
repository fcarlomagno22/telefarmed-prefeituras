import { HeartRateContext, HeartRateReading } from '../types/heartRate'
import { IntegrationConnectionState } from '../types/healthIntegrations'
import { sortHeartRateReadings } from '../utils/heartRate'

function buildTodayReading(
  hoursAgo: number,
  minutesOffset: number,
  bpm: number,
  source: HeartRateReading['source'],
  context: HeartRateContext,
): HeartRateReading {
  const recordedAt = new Date()
  recordedAt.setHours(
    recordedAt.getHours() - hoursAgo,
    recordedAt.getMinutes() - minutesOffset,
    0,
    0,
  )

  return {
    id: `${source}-${context}-${hoursAgo}-${minutesOffset}-${bpm}`,
    bpm,
    recordedAt,
    source,
    context,
  }
}

/** Leituras sintéticas usadas ao conectar integração mock (POST source=integracao). */
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

export function hasHeartRateIntegration(
  connections: Record<string, IntegrationConnectionState>,
): boolean {
  return Object.values(connections).some(
    (connection) =>
      connection.status === 'connected' &&
      connection.enabledPermissions?.includes('heart-rate'),
  )
}
