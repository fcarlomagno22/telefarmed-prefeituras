import type { GeoCoordinates } from '../utils/geo'

export type RunningRouteSpotType = 'park' | 'track' | 'waterfront' | 'trail' | 'plaza'

export type RunningRouteSpot = {
  id: string
  name: string
  type: RunningRouteSpotType
  description: string
  latitude: number
  longitude: number
  distanceKm: number
  walkMinutes: number
  recommendCount: number
  notRecommendCount: number
}

export type RunningRouteSpotComment = {
  id: string
  authorName: string
  text: string
  createdAt: string
}

export type RunningRouteVote = 'recommend' | 'not-recommend'

export type RunningRoutesOrigin = GeoCoordinates & {
  label: string
}
