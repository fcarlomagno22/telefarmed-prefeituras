import {
  NEARBY_UNITS_LEAFLET_CSS_URL,
  NEARBY_UNITS_LEAFLET_JS_URL,
  NEARBY_UNITS_TILE_URL,
} from '../../nearbyUnits/nearbyUnitsMapShared'

export type RunningRouteSpotPickerMapProps = {
  initialLatitude: number
  initialLongitude: number
  initialZoom?: number
  initialPin?: { latitude: number; longitude: number } | null
  userLocation?: { latitude: number; longitude: number } | null
  onPick: (coords: { latitude: number; longitude: number }) => void
}

export const SPOT_PICKER_LEAFLET_CSS_URL = NEARBY_UNITS_LEAFLET_CSS_URL
export const SPOT_PICKER_LEAFLET_JS_URL = NEARBY_UNITS_LEAFLET_JS_URL
export const SPOT_PICKER_TILE_URL = NEARBY_UNITS_TILE_URL

export const SPOT_PICKER_MAP_CUSTOM_CSS = `
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0e0e14; }
  .leaflet-container { background: #0e0e14; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .pick-marker {
    width: 28px;
    height: 28px;
    border-radius: 50% 50% 50% 0;
    background: #ff8533;
    border: 3px solid #fff;
    transform: rotate(-45deg);
    box-shadow: 0 4px 14px rgba(255, 107, 0, 0.45);
    position: relative;
  }
  .pick-marker::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    border-radius: 50%;
    background: #fff;
  }
  .user-pin {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #38bdf8;
    border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(56,189,248,0.25), 0 4px 14px rgba(0,0,0,0.45);
    position: relative;
  }
  .user-pulse {
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    border: 2px solid rgba(56,189,248,0.45);
    animation: running-route-spot-picker-pulse 2s ease-out infinite;
  }
  @keyframes running-route-spot-picker-pulse {
    0% { transform: scale(0.55); opacity: 0.9; }
    70% { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(1.15); opacity: 0; }
  }
`

export const SPOT_PICKER_PICK_MARKER_HTML = '<div class="pick-marker"></div>'
export const SPOT_PICKER_USER_PIN_HTML =
  '<div class="user-pin"><div class="user-pulse"></div></div>'

export function parsePickerMapMessage(data: string): { latitude: number; longitude: number } | null {
  try {
    const payload = JSON.parse(data) as {
      type?: string
      latitude?: number
      longitude?: number
    }

    if (
      payload.type === 'pick' &&
      typeof payload.latitude === 'number' &&
      typeof payload.longitude === 'number'
    ) {
      return { latitude: payload.latitude, longitude: payload.longitude }
    }
  } catch {
    // ignore malformed messages
  }

  return null
}
