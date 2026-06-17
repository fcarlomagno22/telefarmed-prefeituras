import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import { resolveMapMarkerHeading, type GeoCoordinates } from '../../../utils/geo'

type RunWalkActivityTrailMapProps = {
  trail: GeoCoordinates[]
  height?: number
  fullscreen?: boolean
  interactive?: boolean
  liveTracking?: boolean
  profilePhotoUri?: string | null
  deviceHeadingDegrees?: number | null
}

function buildPinStyles() {
  return `
      .leaflet-marker-icon.live-pin-wrap {
        background: transparent !important;
        border: none !important;
        overflow: visible !important;
      }
      .live-pin-wrap {
        background: transparent !important;
        border: none !important;
        overflow: visible !important;
      }
      .live-pin-shell {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .live-pin-body {
        position: absolute;
        left: 50%;
        top: 50%;
        width: var(--pin-size);
        height: var(--pin-size);
        margin-left: calc(var(--pin-size) / -2);
        margin-top: calc(var(--pin-size) / -2);
        border-radius: 50%;
        box-sizing: border-box;
        z-index: 1;
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
      .live-pin-arrow {
        position: absolute;
        inset: 0;
        z-index: 3;
        transform-origin: 50% 50%;
        pointer-events: none;
        will-change: transform;
        transition: opacity 0.15s ease;
      }
      .live-pin-arrow-tip {
        position: absolute;
        left: 50%;
        top: calc(50% - var(--pin-r));
        width: 0;
        height: 0;
        transform: translate(-50%, calc(-100% + 1px));
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 7px solid #ffffff;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
      }
      .live-pin-shell.is-photo .live-pin-arrow-tip {
        border-left-width: 6px;
        border-right-width: 6px;
        border-bottom-width: 8px;
        transform: translate(-50%, calc(-100% + 1px));
      }
  `
}

function getPinMetrics(hasPhoto: boolean) {
  if (hasPhoto) {
    return { circleSize: 36, iconSize: 44, anchor: 22, pinRadius: 18 }
  }

  return { circleSize: 22, iconSize: 30, anchor: 15, pinRadius: 11 }
}

function buildTrailMapHtml(
  trail: GeoCoordinates[],
  profilePhotoDataUri: string | null,
  interactive: boolean,
  liveTracking: boolean,
) {
  const trailJson = JSON.stringify(trail.map((point) => [point.latitude, point.longitude]))
  const current = trail[trail.length - 1]
  const centerLat = current?.latitude ?? -23.5505
  const centerLng = current?.longitude ?? -46.6333
  const hasTrail = trail.length > 0
  const hasPhoto = Boolean(profilePhotoDataUri)
  const pinMetrics = getPinMetrics(hasPhoto)
  const pinSize = pinMetrics.iconSize
  const pinAnchor = pinMetrics.anchor
  const pinRadius = pinMetrics.pinRadius
  const circleSize = pinMetrics.circleSize
  const photoSrcJson = profilePhotoDataUri ? JSON.stringify(profilePhotoDataUri) : 'null'
  const initialHeading = resolveMapMarkerHeading(trail, null, null) ?? 0

  const mapOptions = interactive
    ? `{
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        dragging: true,
        doubleClickZoom: true,
        scrollWheelZoom: false,
        boxZoom: false,
        tap: true,
        minZoom: 10,
        maxZoom: 19,
      }`
    : `{ zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false }`

  const autoFitBounds = !liveTracking

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #0b0f14; touch-action: none; }
      .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
      ${buildPinStyles()}
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const map = L.map('map', ${mapOptions})
        .setView([${centerLat}, ${centerLng}], ${hasTrail ? 16 : 14});

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      let polyline = null;
      let marker = null;
      let arrowElement = null;
      let lastKnownHeading = 0;
      const pinPhotoSrc = ${photoSrcJson};
      const pinSize = ${pinSize};
      const pinAnchor = ${pinAnchor};
      const pinRadius = ${pinRadius};
      const circleSize = ${circleSize};
      const autoFitBounds = ${autoFitBounds ? 'true' : 'false'};
      const liveTracking = ${liveTracking ? 'true' : 'false'};

      function buildPinHtml(heading, showArrow) {
        const hasPhoto = !!pinPhotoSrc;
        const shellClass = 'live-pin-shell' + (hasPhoto ? ' is-photo' : '');
        const safeHeading = Number.isFinite(Number(heading)) ? Number(heading) : lastKnownHeading;
        const arrowStyle = showArrow
          ? 'transform: rotate(' + safeHeading + 'deg); opacity: 1;'
          : 'opacity: 0;';
        const shellStyle =
          '--pin-r: ' + pinRadius + 'px; --pin-size: ' + circleSize + 'px;';
        const bodyClass = 'live-pin-body ' + (hasPhoto ? 'is-photo' : 'is-dot');
        const bodyMarkup = hasPhoto
          ? '<div class="' + bodyClass + '"><img src="' + pinPhotoSrc + '" alt="" /></div>'
          : '<div class="' + bodyClass + '"></div>';

        return '<div class="' + shellClass + '" style="' + shellStyle + '">' +
          bodyMarkup +
          '<div class="live-pin-arrow" style="' + arrowStyle + '">' +
          '<span class="live-pin-arrow-tip"></span>' +
          '</div></div>';
      }

      function createMarkerIcon(heading, showArrow) {
        return L.divIcon({
          className: 'live-pin-wrap',
          html: buildPinHtml(heading, showArrow),
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinAnchor, pinAnchor],
        });
      }

      function syncArrowElement() {
        arrowElement = marker && marker.getElement
          ? marker.getElement().querySelector('.live-pin-arrow')
          : null;
      }

      function applyMarkerHeading(heading, showArrow) {
        if (heading != null && Number.isFinite(Number(heading))) {
          lastKnownHeading = Number(heading);
        }

        if (!arrowElement) {
          syncArrowElement();
        }

        if (arrowElement) {
          arrowElement.style.transform = 'rotate(' + lastKnownHeading + 'deg)';
          arrowElement.style.opacity = showArrow === false ? '0' : '1';
          return;
        }

        if (marker) {
          marker.setIcon(createMarkerIcon(lastKnownHeading, showArrow !== false));
          syncArrowElement();
        }
      }

      function ensureMarker(latlng, heading) {
        if (!marker) {
          if (heading != null && Number.isFinite(Number(heading))) {
            lastKnownHeading = Number(heading);
          }
          marker = L.marker(latlng, {
            icon: createMarkerIcon(lastKnownHeading, true),
            zIndexOffset: 1000,
          }).addTo(map);
          syncArrowElement();
          return;
        }

        marker.setLatLng(latlng);
      }

      function updateLiveTrailMap(trailPoints, heading) {
        if (trailPoints.length > 1) {
          if (!polyline) {
            polyline = L.polyline(trailPoints, {
              color: '#22c55e',
              weight: 4,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);
          } else {
            polyline.setLatLngs(trailPoints);
          }
        }

        if (trailPoints.length > 0) {
          const last = trailPoints[trailPoints.length - 1];
          ensureMarker(last, heading);
          if (heading != null && Number.isFinite(Number(heading))) {
            applyMarkerHeading(heading, true);
          }

          if (liveTracking) {
            map.panTo(last, { animate: true, duration: 0.35 });
          }
        }

        if (autoFitBounds && trailPoints.length > 1) {
          const bounds = L.latLngBounds(trailPoints);
          map.fitBounds(bounds, { padding: [28, 28], maxZoom: 17 });
        }
      }

      function updateLiveMarkerHeading(heading) {
        if (heading == null || !Number.isFinite(Number(heading))) return;
        applyMarkerHeading(Number(heading), true);
      }

      window.updateLiveTrailMap = updateLiveTrailMap;
      window.updateLiveMarkerHeading = updateLiveMarkerHeading;

      updateLiveTrailMap(${liveTracking ? '[]' : trailJson}, ${liveTracking ? 'null' : initialHeading});

      ${interactive ? `
      map.on('dblclick', function(event) {
        map.setView(event.latlng, Math.min(map.getZoom() + 1, map.getMaxZoom()));
      });
      ` : ''}
    </script>
  </body>
</html>`
}

function buildTrailUpdateScript(trail: GeoCoordinates[]) {
  const trailJson = JSON.stringify(trail.map((point) => [point.latitude, point.longitude]))
  const heading = resolveMapMarkerHeading(trail, null, null)
  const headingValue =
    trail.length > 0 && heading != null ? String(heading) : 'null'

  return `
    (function () {
      if (typeof window.updateLiveTrailMap !== 'function') return true;
      window.updateLiveTrailMap(${trailJson}, ${headingValue});
      return true;
    })();
  `
}

function buildHeadingUpdateScript(heading: number) {
  return `
    (function () {
      if (typeof window.updateLiveMarkerHeading !== 'function') return true;
      window.updateLiveMarkerHeading(${heading});
      return true;
    })();
  `
}

export function RunWalkActivityTrailMap({
  trail,
  height = 180,
  fullscreen = false,
  interactive = false,
  liveTracking = false,
  profilePhotoUri,
  deviceHeadingDegrees = null,
}: RunWalkActivityTrailMapProps) {
  const webViewRef = useRef<WebView>(null)
  const lastHeadingRef = useRef<number | null>(null)
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    const trimmed = profilePhotoUri?.trim()
    if (!trimmed) {
      setProfilePhotoDataUri(null)
      return
    }

    let active = true

    async function loadPhoto() {
      const dataUri = await profilePhotoToDataUri(trimmed!)
      if (active) {
        setProfilePhotoDataUri(dataUri)
      }
    }

    void loadPhoto()
    return () => {
      active = false
    }
  }, [profilePhotoUri])

  const html = useMemo(
    () => buildTrailMapHtml(trail, profilePhotoDataUri, interactive, liveTracking),
    liveTracking
      ? [interactive, liveTracking, profilePhotoDataUri]
      : [interactive, liveTracking, profilePhotoDataUri, trail],
  )

  useEffect(() => {
    setIsMapReady(false)
  }, [html])

  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return

    webViewRef.current.injectJavaScript(buildTrailUpdateScript(trail))
  }, [isMapReady, trail])

  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return

    const resolvedHeading = resolveMapMarkerHeading(
      trail,
      deviceHeadingDegrees,
      lastHeadingRef.current,
    )
    if (resolvedHeading == null) return

    lastHeadingRef.current = resolvedHeading

    webViewRef.current.injectJavaScript(buildHeadingUpdateScript(resolvedHeading))
  }, [deviceHeadingDegrees, isMapReady, trail])

  return (
    <View style={[styles.wrap, fullscreen ? styles.wrapFullscreen : { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={interactive}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={interactive}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onLoadEnd={() => setIsMapReady(true)}
        {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : {})}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    backgroundColor: '#0b0f14',
  },
  wrapFullscreen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
})
