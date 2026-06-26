import type { GeoCoordinates } from '../utils/geo'

export type RunningRouteSpotType = 'park' | 'track' | 'waterfront' | 'trail' | 'plaza'

export type RunningRouteLocationSource = 'gps' | 'address'

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
  coverPhotoUri?: string | null
  addressLabel?: string
  locationSource?: RunningRouteLocationSource
  submittedByName?: string
  submittedByCpf?: string
  createdAt?: string
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

export type SubmitRunningRouteSpotInput = {
  name: string
  description: string
  type: RunningRouteSpotType
  latitude: number
  longitude: number
  addressLabel: string
  locationSource: RunningRouteLocationSource
  coverPhotoUri: string
  submittedByCpf: string
  submittedByName: string
}

export type RunningRouteSpotRecord = Omit<
  RunningRouteSpot,
  'distanceKm' | 'walkMinutes'
>
