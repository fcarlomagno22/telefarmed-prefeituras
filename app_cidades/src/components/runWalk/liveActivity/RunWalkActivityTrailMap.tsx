import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import { resolveMapMarkerHeading, type GeoCoordinates } from '../../../utils/geo'

type RunWalkActivityTrailMapProps = {
  trail: GeoCoordinates[]
  currentPosition?: GeoCoordinates | null
  height?: number
  fullscreen?: boolean
  interactive?: boolean
  liveTracking?: boolean
  followUser?: boolean
  onUserPanned?: () => void
  profilePhotoUri?: string | null
  deviceHeadingDegrees?: number | null
}

function buildPinStyles(hasPhoto: boolean) {
  const dotSize = hasPhoto ? 36 : 22
  const dotBorder = hasPhoto ? 3 : 3

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
        width: ${dotSize}px;
        height: ${dotSize}px;
        overflow: visible;
      }
      .live-pin-body {
        position: absolute;
        left: 0;
        top: 0;
        width: ${dotSize}px;
        height: ${dotSize}px;
        border-radius: 50%;
        box-sizing: border-box;
        z-index: 1;
      }
      .live-pin-body.is-dot {
        background: #22c55e;
        border: ${dotBorder}px solid #fff;
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
      .live-pin-pulse {
        position: absolute;
        left: 50%;
        top: 50%;
        width: ${dotSize}px;
        height: ${dotSize}px;
        margin-left: -${dotSize / 2}px;
        margin-top: -${dotSize / 2}px;
        border-radius: 50%;
        border: 2px solid rgba(34, 197, 94, 0.45);
        animation: live-pin-pulse 2s ease-out infinite;
        pointer-events: none;
        z-index: 0;
      }
      @keyframes live-pin-pulse {
        0% { transform: scale(0.7); opacity: 0.85; }
        70% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      .live-pin-arrow {
        position: absolute;
        left: 0;
        top: 0;
        width: ${dotSize}px;
        height: ${dotSize}px;
        z-index: 3;
        transform-origin: 50% 50%;
        pointer-events: none;
      }
      .live-pin-arrow-tip {
        position: absolute;
        left: 50%;
        top: 0;
        width: 0;
        height: 0;
        transform: translate(-50%, calc(-100% + 2px));
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 8px solid #ffffff;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
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

  const mapOptions = interactive || liveTracking
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
        bearing: 0,
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
      ${buildPinStyles(hasPhoto)}
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
      let liveSegment = null;
      let marker = null;
      let arrowElement = null;
      let lastKnownHeading = 0;
      let trailCoords = [];
      let followUser = true;
      let animFrame = null;
      let animStart = 0;
      let animFrom = null;
      let animTo = null;
      let animDuration = 900;
      let mapBearing = 0;
      const mapRotationEnabled = false;
      let pinPhotoSrc = ${photoSrcJson};
      const pinSize = ${pinSize};
      const pinAnchor = ${pinAnchor};
      const pinRadius = ${pinRadius};
      const circleSize = ${circleSize};
      const autoFitBounds = ${autoFitBounds ? 'true' : 'false'};
      const liveTracking = ${liveTracking ? 'true' : 'false'};
      const mapInteractive = ${interactive || liveTracking ? 'true' : 'false'};

      function toLatLng(point) {
        if (!point) return null;
        if (point.lat != null && point.lng != null) {
          return L.latLng(Number(point.lat), Number(point.lng));
        }
        if (Array.isArray(point) && point.length >= 2) {
          return L.latLng(Number(point[0]), Number(point[1]));
        }
        return null;
      }

      function normalizeTrail(trailPoints) {
        return (trailPoints || []).map(toLatLng).filter(Boolean);
      }

      function postMessage(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function buildPinHtml(heading, showArrow) {
        const hasPhoto = !!pinPhotoSrc;
        const safeHeading = Number.isFinite(Number(heading)) ? Number(heading) : lastKnownHeading;
        const arrowStyle = showArrow
          ? 'transform: rotate(' + safeHeading + 'deg); opacity: 1;'
          : 'opacity: 0;';
        const bodyClass = 'live-pin-body ' + (hasPhoto ? 'is-photo' : 'is-dot');
        const pulseMarkup = hasPhoto ? '' : '<div class="live-pin-pulse"></div>';
        const bodyMarkup = hasPhoto
          ? '<div class="' + bodyClass + '"><img src="' + pinPhotoSrc + '" alt="" /></div>'
          : '<div class="' + bodyClass + '"></div>';

        return '<div class="live-pin-shell">' +
          pulseMarkup +
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
        if (heading != null && Number.isFinite(Number(heading))) {
          lastKnownHeading = Number(heading);
        }

        if (!marker) {
          marker = L.marker(latlng, {
            icon: createMarkerIcon(lastKnownHeading, true),
            zIndexOffset: 1000,
          }).addTo(map);
          syncArrowElement();
          return;
        }

        marker.setLatLng(latlng);
      }

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function cancelAnimation() {
        if (animFrame) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
      }

      function applyMapRotation() {
        if (!mapRotationEnabled) return;
        const pane = map.getPane('mapPane');
        if (!pane) return;
        const size = map.getSize();
        if (!size || !size.x || !size.y) return;
        pane.style.transformOrigin = (size.x / 2) + 'px ' + (size.y / 2) + 'px';
        pane.style.transform = 'rotate(' + mapBearing + 'deg)';
      }

      function setMapBearing(heading) {
        if (!mapRotationEnabled) return;
        if (heading == null || !Number.isFinite(Number(heading))) return;
        mapBearing = -Number(heading);
        applyMapRotation();
      }

      function followMapTo(latlng) {
        if (!followUser) return;
        map.setView(latlng, map.getZoom(), { animate: false });
        applyMapRotation();
      }

      function updateLiveSegment(targetLatLng) {
        const target = toLatLng(targetLatLng);
        if (!liveTracking || trailCoords.length === 0 || !target) {
          if (liveSegment) {
            map.removeLayer(liveSegment);
            liveSegment = null;
          }
          return;
        }

        const lastCommitted = trailCoords[trailCoords.length - 1];
        if (
          Math.abs(lastCommitted.lat - target.lat) < 0.0000005 &&
          Math.abs(lastCommitted.lng - target.lng) < 0.0000005
        ) {
          if (liveSegment) {
            map.removeLayer(liveSegment);
            liveSegment = null;
          }
          return;
        }

        if (!liveSegment) {
          liveSegment = L.polyline([lastCommitted, target], {
            color: '#22c55e',
            weight: 4,
            opacity: 0.72,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
        } else {
          liveSegment.setLatLngs([lastCommitted, target]);
        }
      }

      function animateMarkerTo(targetLatLng, durationMs) {
        cancelAnimation();
        const target = toLatLng(targetLatLng);
        if (!target) return;

        if (!marker) {
          ensureMarker(target, lastKnownHeading);
          marker.setLatLng(target);
          followMapTo(target);
          updateLiveSegment(target);
          return;
        }

        marker.setLatLng(target);
        followMapTo(target);
        updateLiveSegment(target);
      }

      function resetTrailPolyline(trailPoints) {
        if (polyline) {
          map.removeLayer(polyline);
          polyline = null;
        }
        if (liveSegment) {
          map.removeLayer(liveSegment);
          liveSegment = null;
        }
        trailCoords = normalizeTrail(trailPoints);

        if (trailCoords.length > 1) {
          polyline = L.polyline(trailCoords, {
            color: '#22c55e',
            weight: 4,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
        }
      }

      function appendTrailPoints(trailPoints) {
        const normalized = normalizeTrail(trailPoints);

        if (normalized.length < trailCoords.length) {
          resetTrailPolyline(normalized);
          return;
        }

        if (normalized.length === 0) {
          resetTrailPolyline([]);
          return;
        }

        const newPoints = normalized.slice(trailCoords.length);
        if (newPoints.length === 0) return;

        if (!polyline) {
          polyline = L.polyline(newPoints, {
            color: '#22c55e',
            weight: 4,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
        } else {
          newPoints.forEach((point) => polyline.addLatLng(point));
        }

        trailCoords = normalized.slice();

        if (liveSegment) {
          map.removeLayer(liveSegment);
          liveSegment = null;
        }
      }

      function updateLiveTrailMap(trailPoints, heading, currentLat, currentLng, shouldFollow) {
        if (typeof shouldFollow === 'boolean') {
          followUser = shouldFollow;
        }

        appendTrailPoints(trailPoints);

        const hasCurrent =
          currentLat != null &&
          currentLng != null &&
          Number.isFinite(Number(currentLat)) &&
          Number.isFinite(Number(currentLng));

        const target = hasCurrent
          ? L.latLng(Number(currentLat), Number(currentLng))
          : trailCoords.length > 0
            ? trailCoords[trailCoords.length - 1]
            : null;

        if (!target) return;

        ensureMarker(target, heading);

        if (heading != null && Number.isFinite(Number(heading))) {
          applyMarkerHeading(heading, true);
          setMapBearing(Number(heading));
        }

        if (liveTracking) {
          animateMarkerTo(target, animDuration);
        } else {
          marker.setLatLng(target);
          followMapTo(target);
        }

        if (autoFitBounds && trailCoords.length > 1) {
          const bounds = L.latLngBounds(trailCoords);
          map.fitBounds(bounds, { padding: [28, 28], maxZoom: 17 });
          applyMapRotation();
        }
      }

      function updateLiveMarkerHeading(heading) {
        if (heading == null || !Number.isFinite(Number(heading))) return;
        applyMarkerHeading(Number(heading), true);
        setMapBearing(Number(heading));
      }

      function setFollowUser(value) {
        followUser = !!value;
      }

      function recenterOnUser() {
        followUser = true;
        if (!marker) return;

        const latlng = marker.getLatLng();
        map.setView(latlng, Math.max(map.getZoom(), 16), { animate: true });
        applyMapRotation();
      }

      function updatePinPhoto(src) {
        pinPhotoSrc = src || null;
        if (!marker) return;
        marker.setIcon(createMarkerIcon(lastKnownHeading, true));
        syncArrowElement();
      }

      window.updateLiveTrailMap = updateLiveTrailMap;
      window.updateLiveMarkerHeading = updateLiveMarkerHeading;
      window.setMapBearing = setMapBearing;
      window.setFollowUser = setFollowUser;
      window.recenterOnUser = recenterOnUser;
      window.updatePinPhoto = updatePinPhoto;

      updateLiveTrailMap(${liveTracking ? '[]' : trailJson}, ${liveTracking ? 'null' : initialHeading}, null, null, true);

      map.whenReady(function() {
        map.invalidateSize();
        applyMapRotation();
        postMessage({ type: 'mapReady' });
      });

      if (mapInteractive) {
        map.on('dragstart', function() {
          followUser = false;
          postMessage({ type: 'userPanned' });
        });

        map.on('dblclick', function(event) {
          map.setView(event.latlng, Math.min(map.getZoom() + 1, map.getMaxZoom()));
        });
      }
    </script>
  </body>
</html>`
}

function buildPinPhotoUpdateScript(profilePhotoDataUri: string | null) {
  const photoSrcJson = profilePhotoDataUri ? JSON.stringify(profilePhotoDataUri) : 'null'
  return `
    (function () {
      if (typeof window.updatePinPhoto === 'function') {
        window.updatePinPhoto(${photoSrcJson});
      }
      return true;
    })();
  `
}

function buildLiveUpdateScript(
  trail: GeoCoordinates[],
  currentPosition: GeoCoordinates | null | undefined,
  followUser: boolean,
  deviceHeadingDegrees: number | null | undefined,
) {
  const trailJson = JSON.stringify(trail.map((point) => [point.latitude, point.longitude]))
  const heading = resolveMapMarkerHeading(trail, deviceHeadingDegrees, null)
  const headingValue = heading != null ? String(heading) : 'null'
  const currentLat = currentPosition?.latitude ?? null
  const currentLng = currentPosition?.longitude ?? null
  const currentLatValue = currentLat != null ? String(currentLat) : 'null'
  const currentLngValue = currentLng != null ? String(currentLng) : 'null'

  return `
    (function () {
      if (typeof window.updateLiveTrailMap !== 'function') return true;
      window.updateLiveTrailMap(
        ${trailJson},
        ${headingValue},
        ${currentLatValue},
        ${currentLngValue},
        ${followUser ? 'true' : 'false'}
      );
      if (${headingValue} !== null && typeof window.setMapBearing === 'function') {
        window.setMapBearing(${headingValue});
      }
      return true;
    })();
  `
}

function buildHeadingUpdateScript(heading: number) {
  return `
    (function () {
      if (typeof window.updateLiveMarkerHeading === 'function') {
        window.updateLiveMarkerHeading(${heading});
      }
      if (typeof window.setMapBearing === 'function') {
        window.setMapBearing(${heading});
      }
      return true;
    })();
  `
}

function buildFollowUserScript(followUser: boolean) {
  return `
    (function () {
      if (typeof window.setFollowUser === 'function') {
        window.setFollowUser(${followUser ? 'true' : 'false'});
      }
      if (${followUser ? 'true' : 'false'} && typeof window.recenterOnUser === 'function') {
        window.recenterOnUser();
      }
      return true;
    })();
  `
}

export function RunWalkActivityTrailMap({
  trail,
  currentPosition = null,
  height = 180,
  fullscreen = false,
  interactive = false,
  liveTracking = false,
  followUser = true,
  onUserPanned,
  profilePhotoUri,
  deviceHeadingDegrees = null,
}: RunWalkActivityTrailMapProps) {
  const webViewRef = useRef<WebView>(null)
  const lastHeadingRef = useRef<number | null>(null)
  const followUserRef = useRef(followUser)
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    followUserRef.current = followUser
  }, [followUser])

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
    () =>
      buildTrailMapHtml(
        liveTracking ? [] : trail,
        liveTracking ? null : profilePhotoDataUri,
        interactive,
        liveTracking,
      ),
    liveTracking
      ? [interactive, liveTracking]
      : [interactive, liveTracking, profilePhotoDataUri, trail],
  )

  const injectLiveUpdate = useCallback(() => {
    if (!webViewRef.current) return
    webViewRef.current.injectJavaScript(
      buildLiveUpdateScript(trail, currentPosition, followUserRef.current, deviceHeadingDegrees),
    )
  }, [currentPosition, deviceHeadingDegrees, trail])

  useEffect(() => {
    setIsMapReady(false)
  }, [html])

  useEffect(() => {
    if (!isMapReady) return

    injectLiveUpdate()
    const retryTimers = [120, 400, 1000].map((delay) =>
      setTimeout(() => injectLiveUpdate(), delay),
    )

    return () => {
      retryTimers.forEach(clearTimeout)
    }
  }, [injectLiveUpdate, isMapReady])

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

  useEffect(() => {
    if (!isMapReady || !webViewRef.current || !liveTracking) return
    webViewRef.current.injectJavaScript(buildFollowUserScript(followUser))
  }, [followUser, isMapReady, liveTracking])

  useEffect(() => {
    if (!isMapReady || !webViewRef.current || !liveTracking) return
    webViewRef.current.injectJavaScript(buildPinPhotoUpdateScript(profilePhotoDataUri))
  }, [isMapReady, liveTracking, profilePhotoDataUri])

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as { type?: string }
        if (payload.type === 'mapReady') {
          setIsMapReady(true)
        }
        if (payload.type === 'userPanned') {
          onUserPanned?.()
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onUserPanned],
  )

  return (
    <View style={[styles.wrap, fullscreen ? styles.wrapFullscreen : { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={interactive || liveTracking}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={interactive || liveTracking}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => {
          setTimeout(() => injectLiveUpdate(), 50)
        }}
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
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
