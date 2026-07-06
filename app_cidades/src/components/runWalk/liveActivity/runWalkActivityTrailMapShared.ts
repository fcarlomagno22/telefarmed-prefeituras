import type { GeoCoordinates } from '../../../utils/geo'

export type RunWalkActivityTrailMapProps = {
  trail: GeoCoordinates[]
  currentPosition?: GeoCoordinates | null
  height?: number
  fullscreen?: boolean
  interactive?: boolean
  liveTracking?: boolean
  followUser?: boolean
  onUserPanned?: () => void
  onMapInteractionChange?: (active: boolean) => void
  profilePhotoUri?: string | null
  deviceHeadingDegrees?: number | null
  currentSpeedKmh?: number
}

export const TRAIL_MAP_DEFAULT_CENTER = { latitude: -23.5505, longitude: -46.6333 }
export const TRAIL_MAP_LIVE_ZOOM = 17

export {
  NEARBY_UNITS_LEAFLET_CSS_URL as TRAIL_MAP_LEAFLET_CSS_URL,
  NEARBY_UNITS_LEAFLET_JS_URL as TRAIL_MAP_LEAFLET_JS_URL,
  NEARBY_UNITS_TILE_URL as TRAIL_MAP_TILE_URL,
} from '../../nearbyUnits/nearbyUnitsMapShared'

export const TRAIL_MAP_BASE_CSS = `
  html, body, #map { width: 100%; height: 100%; margin: 0; background: #f5f5f7; }
  .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
`

export function buildTrailMapPinStyles(hasPhoto: boolean): string {
  const dotSize = hasPhoto ? 36 : 22

  return `
    .leaflet-marker-icon.live-pin-wrap {
      background: transparent !important;
      border: none !important;
      overflow: visible !important;
    }
    .live-pin-shell {
      position: relative;
      width: ${dotSize}px;
      height: ${dotSize}px;
    }
    .live-pin-body {
      width: ${dotSize}px;
      height: ${dotSize}px;
      border-radius: 50%;
      box-sizing: border-box;
    }
    .live-pin-body.is-dot {
      background: #22c55e;
      border: 3px solid #fff;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.22);
    }
    .live-pin-body.is-photo {
      overflow: hidden;
      background: #22c55e;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.22), 0 4px 12px rgba(0, 0, 0, 0.35);
    }
    .live-pin-body.is-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `
}

export function getTrailMapPinMetrics(profilePhotoDataUri: string | null, liveTracking: boolean) {
  const hasPhoto = Boolean(profilePhotoDataUri)
  if (liveTracking) {
    return { hasPhoto, pinSize: hasPhoto ? 36 : 22, pinAnchor: hasPhoto ? 18 : 11 }
  }

  return { hasPhoto, pinSize: hasPhoto ? 44 : 30, pinAnchor: hasPhoto ? 22 : 15 }
}

export function buildTrailMapPinHtml(profilePhotoDataUri: string | null): string {
  const hasPhoto = Boolean(profilePhotoDataUri)
  const bodyClass = `live-pin-body ${hasPhoto ? 'is-photo' : 'is-dot'}`

  if (hasPhoto) {
    const safeSrc = profilePhotoDataUri!.replace(/"/g, '&quot;')
    return `<div class="live-pin-shell"><div class="${bodyClass}"><img src="${safeSrc}" alt="" /></div></div>`
  }

  return `<div class="live-pin-shell"><div class="${bodyClass}"></div></div>`
}

export type TrailMapWebViewMessage =
  | { type: 'mapReady' }
  | { type: 'userPanned' }
  | { type: 'mapInteractionStart' }
  | { type: 'mapInteractionEnd' }

export function parseTrailMapWebViewMessage(data: string): TrailMapWebViewMessage | null {
  try {
    const payload = JSON.parse(data) as { type?: string }
    if (
      payload.type === 'mapReady' ||
      payload.type === 'userPanned' ||
      payload.type === 'mapInteractionStart' ||
      payload.type === 'mapInteractionEnd'
    ) {
      return payload as TrailMapWebViewMessage
    }
  } catch {
    // ignore malformed messages
  }

  return null
}

export function trailToLatLngPairs(trail: GeoCoordinates[]): [number, number][] {
  return trail.map((point) => [point.latitude, point.longitude])
}
