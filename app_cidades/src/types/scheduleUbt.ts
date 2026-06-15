export type ScheduleUbt = {
  id: string
  name: string
  address: string
  neighborhood: string
  city: string
  state: string
  latitude: number
  longitude: number
  phone?: string
}

export type ScheduleUbtWithDistance = ScheduleUbt & {
  distanceKm: number
}
