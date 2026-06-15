import type { ScheduleUbt } from './scheduleUbt'

export type NearbyOriginMode = 'home' | 'gps'

export type NearbyUnitsViewMode = 'map' | 'list'

export type NearbyUnitsFilter = 'all' | 'open-now' | 'nearest' | 'teleconsulta'

export type UbtServiceTag = 'teleconsulta' | 'exames' | 'presencial' | 'pediatria'

export type NearbyUbt = ScheduleUbt & {
  openingHours: string
  isOpenNow: boolean
  services: UbtServiceTag[]
  imageUrl?: string
  distanceKm: number
  walkMinutes: number
  driveMinutes: number
}

export type NearbyOrigin = {
  mode: NearbyOriginMode
  latitude: number
  longitude: number
  label: string
}
