import { GlucoseHistoryEntry, GlucoseReadingContext } from '../types/glucose'

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function buildReading(
  daysAgo: number,
  hour: number,
  minute: number,
  amountMg: number,
  context: GlucoseReadingContext,
): GlucoseHistoryEntry {
  const recordedAt = new Date()
  recordedAt.setDate(recordedAt.getDate() - daysAgo)
  recordedAt.setHours(hour, minute, 0, 0)

  return {
    id: `mock-glucose-${daysAgo}-${hour}-${minute}-${context}`,
    recordedAt: recordedAt.toISOString(),
    amountMg,
    context,
  }
}

/** Histórico simulado com variação realista para demonstração do relatório. */
export function createMockGlucoseHistory(): GlucoseHistoryEntry[] {
  const contexts: GlucoseReadingContext[] = [
    'fasting',
    'pre_meal',
    'post_meal',
    'bedtime',
    'other',
  ]
  const readings: GlucoseHistoryEntry[] = []

  for (let daysAgo = 0; daysAgo < 45; daysAgo += 1) {
    const dailySlots: Array<{ hour: number; minute: number; context: GlucoseReadingContext }> = [
      { hour: 7, minute: 10, context: 'fasting' },
      { hour: 12, minute: 45, context: 'post_meal' },
      { hour: 19, minute: 20, context: 'pre_meal' },
    ]

    if (daysAgo % 3 === 0) {
      dailySlots.push({ hour: 22, minute: 30, context: 'bedtime' })
    }

    dailySlots.forEach((slot, slotIndex) => {
      const seed = daysAgo * 17 + slotIndex * 5 + slot.context.length
      const noise = (seededNoise(seed) - 0.5) * 28
      const trend = Math.sin(daysAgo / 6) * 8 + daysAgo * 0.08
      let base = 92

      if (slot.context === 'fasting') base = 88 + trend * 0.35
      if (slot.context === 'post_meal') base = 128 + trend * 0.5
      if (slot.context === 'pre_meal') base = 96 + trend * 0.25
      if (slot.context === 'bedtime') base = 104 + trend * 0.3

      if (daysAgo === 2 && slot.context === 'post_meal') base = 196
      if (daysAgo === 5 && slot.context === 'fasting') base = 64
      if (daysAgo === 11 && slot.context === 'fasting') base = 138

      const amountMg = Math.round(Math.max(55, Math.min(240, base + noise)))
      readings.push(buildReading(daysAgo, slot.hour, slot.minute, amountMg, slot.context))
    })

    if (daysAgo % 7 === 4) {
      const extraContext = contexts[daysAgo % contexts.length]
      readings.push(
        buildReading(
          daysAgo,
          15,
          5,
          Math.round(102 + (seededNoise(daysAgo + 99) - 0.5) * 20),
          extraContext,
        ),
      )
    }
  }

  return readings.sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )
}

export function registerGlucoseInHistory(
  history: GlucoseHistoryEntry[],
  amountMg: number,
  context: GlucoseReadingContext,
  at: Date = new Date(),
): GlucoseHistoryEntry[] {
  const entry: GlucoseHistoryEntry = {
    id: `glucose-${at.getTime()}-${amountMg}`,
    recordedAt: at.toISOString(),
    amountMg,
    context,
  }

  return [entry, ...history]
}
