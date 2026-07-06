import type { NearbyOrigin, NearbyUbt } from '../../types/nearbyUnits'

export type NearbyUnitsMapProps = {
  origin: NearbyOrigin
  ubts: NearbyUbt[]
  selectedId: string | null
  onSelectUbt: (id: string) => void
}

export type NearbyUnitsMapMarker = {
  id: string
  name: string
  lat: number
  lng: number
  selected: boolean
  open: boolean
}

export const NEARBY_UNITS_LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
export const NEARBY_UNITS_LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
export const NEARBY_UNITS_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

export const NEARBY_UNITS_TILE_LAYER_OPTIONS = {
  maxZoom: 19,
  subdomains: 'abcd',
  updateWhenIdle: true,
  keepBuffer: 4,
} as const

export const NEARBY_UNITS_MAP_CUSTOM_CSS = `
  html, body, #map { width: 100%; height: 100%; margin: 0; background: #f5f5f7; }
  .leaflet-container { background: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .leaflet-control-attribution { display: none !important; }
  .leaflet-control-zoom a {
    background: rgba(255, 255, 255, 0.96) !important;
    color: #1a1a1f !important;
    border-color: rgba(0, 0, 0, 0.12) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  }
  .leaflet-control-zoom a:hover {
    background: #ffffff !important;
    color: #1a1a1f !important;
  }
  .leaflet-popup-content-wrapper,
  .leaflet-popup-tip {
    background: #ffffff !important;
    color: #1a1a1f !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14) !important;
  }
  .leaflet-popup-content {
    margin: 10px 12px !important;
    font-size: 13px !important;
    line-height: 1.4 !important;
  }
  .user-pin-wrap, .ubt-pin-wrap { background: transparent; border: none; }
  .user-pin {
    width: 18px; height: 18px; border-radius: 50%;
    background: #38bdf8; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(56,189,248,0.25), 0 4px 14px rgba(0,0,0,0.45);
    position: relative;
  }
  .user-pulse {
    position: absolute; inset: -14px; border-radius: 50%;
    border: 2px solid rgba(56,189,248,0.45);
    animation: nearby-units-pulse 2s ease-out infinite;
  }
  @keyframes nearby-units-pulse {
    0% { transform: scale(0.55); opacity: 0.9; }
    70% { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(1.15); opacity: 0; }
  }
  .ubt-pin {
    width: 38px; height: 38px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ffb366, #ff6b00, #e55f00);
    border: 2px solid rgba(255,255,255,0.85);
    box-shadow: 0 6px 18px rgba(255,107,0,0.45);
    color: #fff; font-size: 16px; font-weight: 800;
  }
  .ubt-pin.selected {
    transform: scale(1.12);
    box-shadow: 0 0 0 6px rgba(255,133,51,0.28), 0 10px 24px rgba(255,107,0,0.55);
  }
  .ubt-pin.closed { opacity: 0.72; filter: grayscale(0.25); }
`

export function buildNearbyUnitsMapMarkers(
  ubts: NearbyUbt[],
  selectedId: string | null,
): NearbyUnitsMapMarker[] {
  return ubts.map((ubt) => ({
    id: ubt.id,
    name: ubt.name,
    lat: ubt.latitude,
    lng: ubt.longitude,
    selected: ubt.id === selectedId,
    open: ubt.isOpenNow,
  }))
}

export function getNearbyUnitsMapView(
  origin: NearbyOrigin,
  ubts: NearbyUbt[],
  selectedId: string | null,
) {
  const selected = ubts.find((ubt) => ubt.id === selectedId)

  return {
    flyLat: selected?.latitude ?? origin.latitude,
    flyLng: selected?.longitude ?? origin.longitude,
    flyZoom: selected ? 14 : 12,
    hasSelection: Boolean(selected),
  }
}
