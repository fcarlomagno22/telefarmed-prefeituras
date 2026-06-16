export type LiveSharePoint = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

export type LiveShareSession = {
  id: string
  shareToken: string
  participantName: string
  activityName: string
  isActive: boolean
  startedAt: string
  expiresAt: string
}

export type LiveShareSessionSnapshot = LiveShareSession & {
  points: LiveSharePoint[]
}

export type CreateLiveShareSessionInput = {
  participantName: string
  activityName: string
  latitude?: number | null
  longitude?: number | null
  accuracyMeters?: number | null
}

export type AppendLiveSharePointInput = {
  sessionId: string
  latitude: number
  longitude: number
  accuracyMeters?: number | null
}
