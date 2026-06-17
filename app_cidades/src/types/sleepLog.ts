export type SleepQualityScore = 1 | 2 | 3 | 4 | 5

export type SleepLogEntry = {
  id: string
  bedDateIso: string
  bedTimeMinutes: number
  wakeDateIso: string
  wakeTimeMinutes: number
  durationMinutes: number
  quality: SleepQualityScore
  wakeCount: number
  notes?: string
  createdAt: string
}

export type SleepLogDraft = {
  bedDateIso: string
  bedTimeMinutes: number
  wakeTimeMinutes: number
  quality: SleepQualityScore
  wakeCount: number
  notes: string
}
