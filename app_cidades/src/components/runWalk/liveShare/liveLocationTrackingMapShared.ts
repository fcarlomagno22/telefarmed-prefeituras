import type { LiveSharePoint } from '../../../types/runWalkLiveShare'

export type LiveLocationTrackingMapProps = {
  points: LiveSharePoint[]
  participantLabel: string
  activityLabel: string
  fullscreen?: boolean
  bottomInsetPx?: number
  topInsetPx?: number
}

export const LIVE_SHARE_MAP_DEFAULT_CENTER = { latitude: -23.5505, longitude: -46.6333 }

export {
  NEARBY_UNITS_LEAFLET_CSS_URL as LIVE_SHARE_MAP_LEAFLET_CSS_URL,
  NEARBY_UNITS_LEAFLET_JS_URL as LIVE_SHARE_MAP_LEAFLET_JS_URL,
  NEARBY_UNITS_TILE_URL as LIVE_SHARE_MAP_TILE_URL,
} from '../../nearbyUnits/nearbyUnitsMapShared'

export const LIVE_SHARE_MAP_CUSTOM_CSS = `
  html, body, #map { width: 100%; height: 100%; margin: 0; background: #f5f5f7; touch-action: none; }
  .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
  .leaflet-marker-icon.live-pin-wrap {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
  }
  .live-pin-wrap { background: transparent !important; border: none !important; overflow: visible !important; }
  .live-pin-shell { position: relative; width: 30px; height: 30px; overflow: visible; }
  .live-pin-body {
    position: absolute; left: 0; top: 0; width: 22px; height: 22px;
    border-radius: 50%; box-sizing: border-box; z-index: 1;
    background: #22c55e; border: 3px solid #fff;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.22);
  }
  .live-pin-pulse {
    position: absolute; left: 50%; top: 50%; width: 22px; height: 22px;
    margin-left: -11px; margin-top: -11px; border-radius: 50%;
    border: 2px solid rgba(34, 197, 94, 0.45);
    animation: live-share-map-pin-pulse 2s ease-out infinite; pointer-events: none; z-index: 0;
  }
  @keyframes live-share-map-pin-pulse {
    0% { transform: scale(0.7); opacity: 0.85; }
    70% { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1.8); opacity: 0; }
  }
`

export const LIVE_SHARE_PIN_ICON_HTML =
  '<div class="live-pin-shell"><div class="live-pin-pulse"></div><div class="live-pin-body"></div></div>'

export function liveSharePointsToTrail(points: LiveSharePoint[]): [number, number][] {
  return points.map((point) => [point.latitude, point.longitude])
}

export function getLiveShareMapInitialView(points: LiveSharePoint[]) {
  const current = points[points.length - 1]
  return {
    centerLat: current?.latitude ?? LIVE_SHARE_MAP_DEFAULT_CENTER.latitude,
    centerLng: current?.longitude ?? LIVE_SHARE_MAP_DEFAULT_CENTER.longitude,
    zoom: points.length > 0 ? 16 : 14,
    hasTrail: points.length > 0,
  }
}

export function buildLiveShareUpdateScript(
  points: LiveSharePoint[],
  bottomInsetPx: number,
  topInsetPx: number,
): string {
  const trail = JSON.stringify(liveSharePointsToTrail(points))
  return `
    (function () {
      if (typeof window.updateLiveShareMap !== 'function') return true;
      window.updateLiveShareMap(${trail}, ${bottomInsetPx}, ${topInsetPx});
      return true;
    })();
  `
}
