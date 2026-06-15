import {
  HeartRateContext,
  HeartRateReading,
  HeartRateSummary,
  HeartRateZoneLabel,
} from '../types/heartRate'

export const HEART_RATE_NORMAL_MAX_BPM = 100
export const HEART_RATE_HIGH_PEAK_BPM = 120
export const HEART_RATE_BRADYCARDIA_BPM = 60

export const HEART_RATE_CONTEXT_LABELS: Record<HeartRateContext, string> = {
  resting: 'Repouso',
  workout: 'Esforço',
  sleep: 'Sono',
  manual: 'Manual',
}

export function getHeartRateContextLabel(context: HeartRateContext) {
  return HEART_RATE_CONTEXT_LABELS[context]
}

export function isRestingHeartRateContext(context: HeartRateContext) {
  return context === 'resting' || context === 'sleep'
}

export function isWorkoutHeartRateContext(context: HeartRateContext) {
  return context === 'workout'
}

export function formatHeartRateValue(bpm: number) {
  return `${Math.round(bpm)} bpm`
}

export function formatHeartRateDateTime(date: Date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatHeartRateTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function getHeartRateZone(bpm: number): {
  label: HeartRateZoneLabel
  color: string
  bg: string
  border: string
} {
  if (bpm < HEART_RATE_BRADYCARDIA_BPM) {
    return {
      label: 'Repouso',
      color: '#93c5fd',
      bg: 'rgba(147, 197, 253, 0.14)',
      border: 'rgba(147, 197, 253, 0.35)',
    }
  }

  if (bpm <= HEART_RATE_NORMAL_MAX_BPM) {
    return {
      label: 'Normal',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.14)',
      border: 'rgba(52, 211, 153, 0.35)',
    }
  }

  if (bpm <= HEART_RATE_HIGH_PEAK_BPM) {
    return {
      label: 'Elevado',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(251, 191, 36, 0.35)',
    }
  }

  return {
    label: 'Alta',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(248, 113, 113, 0.35)',
  }
}

export function summarizeHeartRate(readings: HeartRateReading[]): HeartRateSummary {
  if (readings.length === 0) {
    return { min: 0, avg: 0, max: 0, count: 0 }
  }

  const values = readings.map((reading) => reading.bpm)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    count: readings.length,
  }
}

export function isPeakAboveNormal(bpm: number, threshold = HEART_RATE_NORMAL_MAX_BPM) {
  return bpm > threshold
}

export function isHighHeartRatePeak(bpm: number, threshold = HEART_RATE_HIGH_PEAK_BPM) {
  return bpm > threshold
}

export function isBradycardia(bpm: number, threshold = HEART_RATE_BRADYCARDIA_BPM) {
  return bpm < threshold
}

export function sortHeartRateReadings(readings: HeartRateReading[]) {
  return [...readings].sort(
    (left, right) => right.recordedAt.getTime() - left.recordedAt.getTime(),
  )
}

export function filterHeartRateReadingsByPeriod(
  readings: HeartRateReading[],
  start: Date,
  end: Date,
) {
  const startMs = start.getTime()
  const endMs = end.getTime()

  return readings.filter((reading) => {
    const timestamp = reading.recordedAt.getTime()
    return timestamp >= startMs && timestamp <= endMs
  })
}

export function serializeHeartRateReading(reading: HeartRateReading) {
  return {
    ...reading,
    recordedAt: reading.recordedAt.toISOString(),
  }
}

export function deserializeHeartRateReading(
  stored: Omit<HeartRateReading, 'recordedAt'> & { recordedAt: string },
): HeartRateReading {
  return {
    ...stored,
    recordedAt: new Date(stored.recordedAt),
  }
}
