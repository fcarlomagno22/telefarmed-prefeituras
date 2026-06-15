import { BloodPressureHistoryEntry } from '../types/bloodPressure'

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function buildReading(
  daysAgo: number,
  hour: number,
  minute: number,
  systolic: number,
  diastolic: number,
): BloodPressureHistoryEntry {
  const recordedAt = new Date()
  recordedAt.setDate(recordedAt.getDate() - daysAgo)
  recordedAt.setHours(hour, minute, 0, 0)

  return {
    id: `mock-bp-${daysAgo}-${hour}-${minute}`,
    recordedAt: recordedAt.toISOString(),
    systolic,
    diastolic,
  }
}

/** Histórico simulado com manhã/noite, picos isolados e hipertensão sustentada. */
export function createMockBloodPressureHistory(): BloodPressureHistoryEntry[] {
  const readings: BloodPressureHistoryEntry[] = []

  for (let daysAgo = 0; daysAgo < 45; daysAgo += 1) {
    const seed = daysAgo * 13
    const noise = (seededNoise(seed) - 0.5) * 10
    const trend = Math.sin(daysAgo / 8) * 6

    let morningSys = 118 + trend + noise
    let morningDia = 76 + trend * 0.45 + noise * 0.35
    let eveningSys = 122 + trend * 0.8 + noise * 0.6
    let eveningDia = 78 + trend * 0.35 + noise * 0.25

    // Hipertensão sustentada (3 dias consecutivos)
    if (daysAgo >= 3 && daysAgo <= 5) {
      morningSys = 148 + noise * 0.4
      morningDia = 94 + noise * 0.3
      eveningSys = 152 + noise * 0.5
      eveningDia = 96 + noise * 0.35
    }

    // Pico isolado (apenas 1 dia)
    if (daysAgo === 12) {
      eveningSys = 156
      eveningDia = 98
    }

    // Manhã tende a subir mais em alguns dias
    if (daysAgo % 9 === 0) {
      morningSys += 14
      morningDia += 8
    }

    // Noite elevada em dias alternados
    if (daysAgo % 6 === 2) {
      eveningSys += 10
      eveningDia += 6
    }

    readings.push(
      buildReading(
        daysAgo,
        7,
        30,
        Math.round(Math.max(95, Math.min(180, morningSys))),
        Math.round(Math.max(55, Math.min(115, morningDia))),
      ),
    )
    readings.push(
      buildReading(
        daysAgo,
        20,
        15,
        Math.round(Math.max(98, Math.min(185, eveningSys))),
        Math.round(Math.max(58, Math.min(120, eveningDia))),
      ),
    )

    if (daysAgo % 4 === 0) {
      readings.push(
        buildReading(
          daysAgo,
          14,
          10,
          Math.round(116 + (seededNoise(seed + 4) - 0.5) * 12),
          Math.round(74 + (seededNoise(seed + 5) - 0.5) * 8),
        ),
      )
    }
  }

  return readings.sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )
}

export function registerBloodPressureInHistory(
  history: BloodPressureHistoryEntry[],
  systolic: number,
  diastolic: number,
  at: Date = new Date(),
): BloodPressureHistoryEntry[] {
  const entry: BloodPressureHistoryEntry = {
    id: `bp-${at.getTime()}-${systolic}-${diastolic}`,
    recordedAt: at.toISOString(),
    systolic,
    diastolic,
  }

  return [entry, ...history]
}
