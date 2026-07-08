import type { GeoCoordinates } from '../../../utils/geo'
import type { RunWalkLiveGpsFeed, RunWalkLiveMapTrailFeed } from '../../../hooks/runWalkLiveGpsFeed'

export type RunWalkActivityTrailMapProps = {
  trail: GeoCoordinates[]
  currentPosition?: GeoCoordinates | null
  /** High-frequency GPS updates without parent re-renders. */
  liveGpsFeed?: RunWalkLiveGpsFeed | null
  /** Trail + display speed snapshots for live map rendering. */
  mapTrailFeed?: RunWalkLiveMapTrailFeed | null
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
  /** Quando falso, o mapa fica com o norte para cima. */
  rotateWithHeading?: boolean
  /** Pausa interpolação live do pin/câmera (native maps). */
  isPaused?: boolean
}

export const TRAIL_MAP_DEFAULT_CENTER = { latitude: -23.5505, longitude: -46.6333 }
export const TRAIL_MAP_LIVE_ZOOM = 17
/** Approximate region delta for live follow (~zoom 17). */
export const TRAIL_MAP_LIVE_LATITUDE_DELTA = 0.0025
export const TRAIL_MAP_LIVE_LONGITUDE_DELTA = 0.0025

export const TRAIL_MAP_POLYLINE_COLOR = '#22c55e'
export const TRAIL_MAP_LIVE_SEGMENT_OPACITY = 0.72

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

export function buildTrailSignature(trail: GeoCoordinates[]): string {
  return trail.map((point) => `${point.latitude},${point.longitude}`).join('|')
}

function formatLiveMapHeadingValue(heading: number | null): string {
  return heading != null ? String(heading) : 'null'
}

function formatLiveMapCoordinateValue(value: number | null | undefined): string {
  return value != null ? String(value) : 'null'
}

export function buildLivePositionUpdateScript(
  currentPosition: GeoCoordinates | null | undefined,
  heading: number | null,
): string {
  const headingValue = formatLiveMapHeadingValue(heading)
  const currentLatValue = formatLiveMapCoordinateValue(currentPosition?.latitude)
  const currentLngValue = formatLiveMapCoordinateValue(currentPosition?.longitude)

  return `
    (function () {
      if (typeof window.updateLivePosition !== 'function') return true;
      window.updateLivePosition(${currentLatValue}, ${currentLngValue}, ${headingValue});
      return true;
    })();
  `
}

/** Sends only newly committed trail points (incremental bridge payload). */
export function buildLiveTrailAppendScript(
  newTrailPoints: [number, number][],
  currentPosition: GeoCoordinates | null | undefined,
  heading: number | null,
): string {
  const pointsJson = JSON.stringify(newTrailPoints)
  const headingValue = formatLiveMapHeadingValue(heading)
  const currentLatValue = formatLiveMapCoordinateValue(currentPosition?.latitude)
  const currentLngValue = formatLiveMapCoordinateValue(currentPosition?.longitude)

  return `
    (function () {
      if (typeof window.appendLiveTrailPoints !== 'function') return true;
      window.appendLiveTrailPoints(
        ${pointsJson},
        ${headingValue},
        ${currentLatValue},
        ${currentLngValue}
      );
      return true;
    })();
  `
}

/** Full trail resync when local/WebView state diverges (reset, shorter trail). */
export function buildLiveTrailResyncScript(
  trail: GeoCoordinates[],
  currentPosition: GeoCoordinates | null | undefined,
  heading: number | null,
): string {
  const trailJson = JSON.stringify(trailToLatLngPairs(trail))
  const headingValue = formatLiveMapHeadingValue(heading)
  const currentLatValue = formatLiveMapCoordinateValue(currentPosition?.latitude)
  const currentLngValue = formatLiveMapCoordinateValue(currentPosition?.longitude)

  return `
    (function () {
      if (typeof window.updateLiveTrailMap !== 'function') return true;
      window.updateLiveTrailMap(
        ${trailJson},
        ${headingValue},
        ${currentLatValue},
        ${currentLngValue}
      );
      return true;
    })();
  `
}

/** Leaflet live-follow: pin snaps instantly; camera eases toward GPS (or snaps when close). */
export const TRAIL_MAP_LIVE_FOLLOW_JS = `
    let followAnimFrame = null;
    let followTargetLatLng = null;

    function cancelFollowAnimation() {
      if (followAnimFrame != null) {
        cancelAnimationFrame(followAnimFrame);
        followAnimFrame = null;
      }
    }

    function approxDistanceMeters(fromLat, fromLng, toLat, toLng) {
      var avgLatRad = ((fromLat + toLat) / 2) * Math.PI / 180;
      var dLatM = (toLat - fromLat) * 111320;
      var dLngM = (toLng - fromLng) * 111320 * Math.cos(avgLatRad);
      return Math.sqrt(dLatM * dLatM + dLngM * dLngM);
    }

    function tickFollowAnimation() {
      followAnimFrame = null;
      if (!followUser || !followTargetLatLng) return;

      const zoom = map.getZoom();
      const center = map.getCenter();
      const tLat = followTargetLatLng.lat;
      const tLng = followTargetLatLng.lng;
      const centerDistM = approxDistanceMeters(center.lat, center.lng, tLat, tLng);

      programmaticMove = true;
      if (centerDistM < 5) {
        map.setView(L.latLng(tLat, tLng), zoom, { animate: false });
      } else {
        const factor = 0.65;
        const nextLat = center.lat + (tLat - center.lat) * factor;
        const nextLng = center.lng + (tLng - center.lng) * factor;
        map.setView(L.latLng(nextLat, nextLng), zoom, { animate: false });
      }
      programmaticMove = false;
      applyMapRotation();

      const nextCenter = map.getCenter();
      const remaining = Math.abs(nextCenter.lat - tLat) + Math.abs(nextCenter.lng - tLng);
      if (remaining > 0.000002) {
        followAnimFrame = requestAnimationFrame(tickFollowAnimation);
      }
    }
`
