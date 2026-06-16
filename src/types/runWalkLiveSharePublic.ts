export type LiveSharePoint = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

export type LiveShareSessionPublic = {
  id: string
  shareToken: string
  participantName: string
  participantPhotoUrl?: string | null
  activityName: string
  isActive: boolean
  startedAt: string
  expiresAt: string
  points: LiveSharePoint[]
}

export type LiveShareSessionPublicResult = {
  session: LiveShareSessionPublic
}
