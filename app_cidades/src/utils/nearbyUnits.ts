import { fetchScheduleUbts } from '../data/mockScheduleUbts'
import type {
  NearbyOrigin,
  NearbyUbt,
  NearbyUnitsFilter,
  UbtServiceTag,
} from '../types/nearbyUnits'
import type { ScheduleUbt } from '../types/scheduleUbt'
import { formatDistanceKm, GeoCoordinates, haversineDistanceKm } from './geo'

const MOCK_DELAY_MS = 280

const UBT_DETAILS: Record<
  string,
  {
    openingHours: string
    isOpenNow: boolean
    services: UbtServiceTag[]
    imageUrl?: string
  }
> = {
  'ubt-1': {
    openingHours: 'Seg–Sex 7h–19h · Sáb 8h–12h',
    isOpenNow: true,
    services: ['teleconsulta', 'exames', 'presencial'],
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  },
  'ubt-2': {
    openingHours: 'Seg–Sex 8h–18h',
    isOpenNow: true,
    services: ['teleconsulta', 'presencial', 'pediatria'],
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
  },
  'ubt-3': {
    openingHours: 'Seg–Sex 7h30–20h · Sáb 8h–14h',
    isOpenNow: false,
    services: ['teleconsulta', 'exames', 'presencial'],
    imageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90a5ea3b0?w=800&q=80',
  },
  'ubt-4': {
    openingHours: 'Seg–Sex 8h–17h',
    isOpenNow: true,
    services: ['teleconsulta', 'presencial'],
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  },
  'ubt-5': {
    openingHours: 'Seg–Sex 7h–18h · Sáb 8h–12h',
    isOpenNow: true,
    services: ['teleconsulta', 'exames', 'presencial', 'pediatria'],
    imageUrl: 'https://images.unsplash.com/photo-1516549657-9d515bb4d8a1?w=800&q=80',
  },
  'ubt-6': {
    openingHours: 'Seg–Sex 8h–16h',
    isOpenNow: true,
    services: ['teleconsulta', 'presencial'],
    imageUrl: 'https://images.unsplash.com/photo-1581594549595-35f65c4d41b1?w=800&q=80',
  },
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function estimateWalkMinutes(distanceKm: number) {
  return Math.max(1, Math.round((distanceKm / 5) * 60))
}

export function estimateDriveMinutes(distanceKm: number) {
  return Math.max(1, Math.round((distanceKm / 28) * 60))
}

export function enrichNearbyUbt(ubt: ScheduleUbt, origin: GeoCoordinates): NearbyUbt {
  const distanceKm = haversineDistanceKm(origin, {
    latitude: ubt.latitude,
    longitude: ubt.longitude,
  })
  const details = UBT_DETAILS[ubt.id] ?? {
    openingHours: 'Seg–Sex 8h–18h',
    isOpenNow: true,
    services: ['teleconsulta', 'presencial'] as UbtServiceTag[],
  }

  return {
    ...ubt,
    ...details,
    distanceKm,
    walkMinutes: estimateWalkMinutes(distanceKm),
    driveMinutes: estimateDriveMinutes(distanceKm),
  }
}

export async function fetchNearbyUbts(origin: GeoCoordinates): Promise<NearbyUbt[]> {
  await delay(MOCK_DELAY_MS)
  const ubts = await fetchScheduleUbts()
  return ubts
    .map((ubt) => enrichNearbyUbt(ubt, origin))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export function filterNearbyUbts(
  ubts: NearbyUbt[],
  query: string,
  filter: NearbyUnitsFilter,
): NearbyUbt[] {
  let result = [...ubts]
  const normalized = query.trim().toLowerCase()

  if (normalized) {
    result = result.filter(
      (ubt) =>
        ubt.name.toLowerCase().includes(normalized) ||
        ubt.neighborhood.toLowerCase().includes(normalized) ||
        ubt.address.toLowerCase().includes(normalized),
    )
  }

  if (filter === 'open-now') {
    result = result.filter((ubt) => ubt.isOpenNow)
  }

  if (filter === 'teleconsulta') {
    result = result.filter((ubt) => ubt.services.includes('teleconsulta'))
  }

  if (filter === 'nearest') {
    result = [...result].sort((a, b) => a.distanceKm - b.distanceKm)
  }

  return result
}

export function getServiceLabel(service: UbtServiceTag) {
  if (service === 'teleconsulta') return 'Teleconsulta'
  if (service === 'exames') return 'Exames'
  if (service === 'pediatria') return 'Pediatria'
  return 'Atendimento presencial'
}

export function formatNearbyUbtMeta(ubt: NearbyUbt) {
  return `${formatDistanceKm(ubt.distanceKm)} · ~${ubt.driveMinutes} min de carro`
}

export function getMockGpsCoordinates(home: GeoCoordinates): GeoCoordinates {
  return {
    latitude: home.latitude + 0.0042,
    longitude: home.longitude - 0.0031,
  }
}

export function buildNearbyOrigin(
  mode: NearbyOrigin['mode'],
  home: GeoCoordinates,
  gps: GeoCoordinates | null,
): NearbyOrigin {
  if (mode === 'gps' && gps) {
    return {
      mode: 'gps',
      latitude: gps.latitude,
      longitude: gps.longitude,
      label: 'Sua localização',
    }
  }

  return {
    mode: 'home',
    latitude: home.latitude,
    longitude: home.longitude,
    label: 'Seu endereço',
  }
}
