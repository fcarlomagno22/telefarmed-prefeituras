import type { RunningRouteSpot, RunningRoutesOrigin } from '../../types/nearbyRunningRoutes'

export type NearbyRunningRoutesMapProps = {
  origin: RunningRoutesOrigin
  spots: RunningRouteSpot[]
  selectedId: string | null
  profilePhotoUri?: string | null
  onSelectSpot: (id: string) => void
}

export type NearbyRunningRoutesMapMarker = {
  id: string
  name: string
  lat: number
  lng: number
  selected: boolean
}

export {
  NEARBY_UNITS_LEAFLET_CSS_URL as RUNNING_ROUTES_LEAFLET_CSS_URL,
  NEARBY_UNITS_LEAFLET_JS_URL as RUNNING_ROUTES_LEAFLET_JS_URL,
  NEARBY_UNITS_TILE_URL as RUNNING_ROUTES_TILE_URL,
} from '../../nearbyUnits/nearbyUnitsMapShared'

export const RUNNING_ROUTES_MDI_CSS_URL =
  'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css'

export const RUNNING_ROUTES_MAP_CUSTOM_CSS = `
  html, body, #map { width: 100%; height: 100%; margin: 0; background: #f5f5f7; }
  .leaflet-container { background: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .leaflet-control-attribution { display: none !important; }
  .leaflet-control-zoom { display: none !important; }
  .leaflet-popup-content-wrapper,
  .leaflet-popup-tip {
    background: #ffffff !important;
    color: #1a1a1f !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14) !important;
  }
  .leaflet-marker-icon.user-pin-wrap,
  .leaflet-marker-icon.spot-pin-wrap {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
  }
  .user-pin-wrap, .spot-pin-wrap { background: transparent; border: none; }
  .user-pin-shell {
    position: relative;
    width: 36px;
    height: 36px;
    box-sizing: border-box;
  }
  .user-pin {
    width: 18px; height: 18px; border-radius: 50%;
    background: #38bdf8; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(56,189,248,0.25), 0 4px 14px rgba(0,0,0,0.45);
    position: relative;
    box-sizing: border-box;
  }
  .user-pin-body.is-photo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    background: #38bdf8;
    border: 3px solid #fff;
    box-sizing: border-box;
    box-shadow: 0 0 0 5px rgba(56,189,248,0.25), 0 4px 14px rgba(0,0,0,0.45);
  }
  .user-pin-body.is-photo img {
    width: 100%;
    height: 100%;
    max-width: 36px;
    max-height: 36px;
    object-fit: cover;
    display: block;
  }
  .user-pulse {
    position: absolute; inset: -14px; border-radius: 50%;
    border: 2px solid rgba(56,189,248,0.45);
    animation: nearby-running-routes-pulse 2s ease-out infinite;
  }
  @keyframes nearby-running-routes-pulse {
    0% { transform: scale(0.55); opacity: 0.9; }
    70% { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(1.15); opacity: 0; }
  }
  .spot-pin {
    width: 38px; height: 38px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ffb366, #ff6b00, #e55f00);
    border: 2px solid rgba(255,255,255,0.85);
    box-shadow: 0 6px 18px rgba(255,107,0,0.45);
    color: #fff;
  }
  .spot-pin .mdi {
    font-size: 20px;
    line-height: 1;
  }
  .spot-pin.selected {
    transform: scale(1.12);
    box-shadow: 0 0 0 6px rgba(255,133,51,0.28), 0 10px 24px rgba(255,107,0,0.55);
  }
`

export function buildNearbyRunningRoutesMapMarkers(
  spots: RunningRouteSpot[],
  selectedId: string | null,
): NearbyRunningRoutesMapMarker[] {
  return spots.map((spot) => ({
    id: spot.id,
    name: spot.name,
    lat: spot.latitude,
    lng: spot.longitude,
    selected: spot.id === selectedId,
  }))
}

export function getNearbyRunningRoutesMapView(
  origin: RunningRoutesOrigin,
  spots: RunningRouteSpot[],
  selectedId: string | null,
) {
  const selected = spots.find((spot) => spot.id === selectedId)

  return {
    flyLat: selected?.latitude ?? origin.latitude,
    flyLng: selected?.longitude ?? origin.longitude,
    flyZoom: selected ? 14 : 13,
    hasSelection: Boolean(selected),
  }
}

const USER_PIN_PHOTO_SIZE = 36

export function buildNearbyRunningRoutesUserPinHtml(profilePhotoDataUri: string | null): string {
  if (profilePhotoDataUri) {
    const safeSrc = profilePhotoDataUri.replace(/"/g, '&quot;')
    return `<div class="user-pin-shell"><div class="user-pin-body is-photo"><img src="${safeSrc}" alt="" width="${USER_PIN_PHOTO_SIZE}" height="${USER_PIN_PHOTO_SIZE}" style="width:${USER_PIN_PHOTO_SIZE}px;height:${USER_PIN_PHOTO_SIZE}px;max-width:${USER_PIN_PHOTO_SIZE}px;max-height:${USER_PIN_PHOTO_SIZE}px;object-fit:cover;display:block;" /></div></div>`
  }

  return '<div class="user-pin"><div class="user-pulse"></div></div>'
}

export function getNearbyRunningRoutesUserPinMetrics(profilePhotoDataUri: string | null) {
  const hasPhoto = Boolean(profilePhotoDataUri)
  const size = hasPhoto ? 36 : 18
  return { size, anchor: size / 2 }
}
