export type LiveSharePointDto = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

export type LiveShareSessionPublicDto = {
  id: string
  shareToken: string
  participantName: string
  participantPhotoUrl?: string | null
  activityName: string
  isActive: boolean
  startedAt: string
  expiresAt: string
  points: LiveSharePointDto[]
}

export type LiveShareSessionPublicResultDto = {
  session: LiveShareSessionPublicDto
}
