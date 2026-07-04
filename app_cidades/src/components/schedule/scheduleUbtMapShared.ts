import type { ScheduleUbtWithDistance } from '../../types/scheduleUbt'
import type { GeoCoordinates } from '../../utils/geo'

export type ScheduleUbtMapProps = {
  home: GeoCoordinates
  ubts: ScheduleUbtWithDistance[]
  selectedId: string
  onSelectUbt: (id: string) => void
}

export type ScheduleUbtMapLayerMode = 'street' | 'satellite' | 'hybrid'

export type ScheduleUbtMapMarker = {
  id: string
  name: string
  lat: number
  lng: number
  selected: boolean
}

export const SCHEDULE_UBT_LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
export const SCHEDULE_UBT_LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

export const SCHEDULE_UBT_STREET_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const SCHEDULE_UBT_SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const SCHEDULE_UBT_LABELS_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

export const SCHEDULE_UBT_MAP_CONTAINER_CSS = `
  html, body { width: 100%; height: 100%; margin: 0; background: #e8edf2; }
  #map { width: 100%; height: 100%; }
  .leaflet-control-attribution { display: none !important; }
`

export const SCHEDULE_UBT_LAYER_SWITCH_HTML_CSS = `
  #layer-switch {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    display: flex;
    gap: 3px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(14, 14, 20, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  }
  .layer-btn {
    border: none;
    border-radius: 8px;
    padding: 7px 10px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(245, 245, 247, 0.72);
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .layer-btn.active {
    color: #fff;
    background: linear-gradient(135deg, #ff8533, #ff6b00);
    box-shadow: 0 2px 8px rgba(255, 107, 0, 0.45);
  }
`

export function buildScheduleUbtMapMarkers(
  ubts: ScheduleUbtWithDistance[],
  selectedId: string,
): ScheduleUbtMapMarker[] {
  return ubts.map((ubt) => ({
    id: ubt.id,
    name: ubt.name,
    lat: ubt.latitude,
    lng: ubt.longitude,
    selected: ubt.id === selectedId,
  }))
}

export function parseScheduleUbtMapSelectMessage(data: string): string | null {
  try {
    const payload = JSON.parse(data) as { type?: string; id?: string }
    if (payload.type === 'select' && payload.id) return payload.id
  } catch {
    // ignore malformed messages
  }

  return null
}

export const SCHEDULE_UBT_LAYER_OPTIONS: { mode: ScheduleUbtMapLayerMode; label: string }[] = [
  { mode: 'street', label: 'Mapa' },
  { mode: 'satellite', label: 'Satélite' },
  { mode: 'hybrid', label: 'Híbrido' },
]
