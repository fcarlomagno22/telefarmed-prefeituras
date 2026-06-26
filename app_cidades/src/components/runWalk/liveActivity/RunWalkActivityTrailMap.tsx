import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import type { GeoCoordinates } from '../../../utils/geo'
import {
  resolveLiveMapHeading,
  smoothMapHeading,
} from '../../../utils/mapHeadingSmoothing'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'

type RunWalkActivityTrailMapProps = {
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

const DEFAULT_CENTER = { latitude: -23.5505, longitude: -46.6333 }
const LIVE_ZOOM = 17

function buildPinStyles(hasPhoto: boolean) {
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

function buildLiveMapHtml(options: {
  initialLatitude: number
  initialLongitude: number
  interactive: boolean
  hasPhoto: boolean
  photoSrcJson: string
  pinSize: number
  pinAnchor: number
}) {
  const {
    initialLatitude,
    initialLongitude,
    interactive,
    hasPhoto,
    photoSrcJson,
    pinSize,
    pinAnchor,
  } = options

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; background: #0b0f14; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
    ${buildPinStyles(hasPhoto)}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      touchZoom: true,
      dragging: ${interactive ? 'true' : 'false'},
      doubleClickZoom: true,
      scrollWheelZoom: false,
      boxZoom: false,
      minZoom: 10,
      maxZoom: 19,
    }).setView([${initialLatitude}, ${initialLongitude}], ${LIVE_ZOOM});

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    let polyline = null;
    let liveSegment = null;
    let marker = null;
    let trailCoords = [];
    let followUser = true;
    let mapBearing = 0;
    let programmaticMove = false;
    let pinPhotoSrc = ${photoSrcJson};
    const pinSize = ${pinSize};
    const pinAnchor = ${pinAnchor};

    function postMessage(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

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

    function buildPinHtml() {
      const hasPhoto = !!pinPhotoSrc;
      const bodyClass = 'live-pin-body ' + (hasPhoto ? 'is-photo' : 'is-dot');
      const bodyMarkup = hasPhoto
        ? '<div class="live-pin-shell"><div class="' + bodyClass + '"><img src="' + pinPhotoSrc + '" alt="" /></div></div>'
        : '<div class="live-pin-shell"><div class="' + bodyClass + '"></div></div>';
      return bodyMarkup;
    }

    function createMarkerIcon() {
      return L.divIcon({
        className: 'live-pin-wrap',
        html: buildPinHtml(),
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinAnchor, pinAnchor],
      });
    }

    function applyMapRotation() {
      const pane = map.getPane('mapPane');
      if (!pane) return;
      const size = map.getSize();
      if (!size || !size.x || !size.y) return;
      pane.style.transformOrigin = (size.x / 2) + 'px ' + (size.y / 2) + 'px';
      pane.style.transform = mapBearing === 0 ? '' : 'rotate(' + mapBearing + 'deg)';
    }

    function setMapBearing(heading) {
      if (!followUser) return;
      if (heading == null || !Number.isFinite(Number(heading))) return;
      mapBearing = -Number(heading);
      applyMapRotation();
    }

    function clearMapRotation() {
      mapBearing = 0;
      applyMapRotation();
    }

    function followMapTo(latlng, forceZoom) {
      if (!followUser || !latlng) return;
      const zoom = forceZoom != null ? forceZoom : map.getZoom();
      programmaticMove = true;
      map.setView(latlng, zoom, { animate: false });
      programmaticMove = false;
      applyMapRotation();
    }

    function ensureMarker(latlng) {
      if (!latlng) return;
      if (!marker) {
        marker = L.marker(latlng, {
          icon: createMarkerIcon(),
          zIndexOffset: 1000,
        }).addTo(map);
      } else {
        marker.setLatLng(latlng);
      }
      window.__lastKnownLatLng = latlng;
    }

    function syncFollowMode(shouldFollow, latlng) {
      followUser = !!shouldFollow;
      if (latlng) ensureMarker(latlng);
      if (followUser) {
        followMapTo(latlng);
        if (window.__lastMapHeading != null) {
          setMapBearing(window.__lastMapHeading);
        }
        return;
      }
      clearMapRotation();
    }

    function handleUserMapInteraction() {
      if (programmaticMove || !followUser) return;
      followUser = false;
      clearMapRotation();
      postMessage({ type: 'userPanned' });
    }

    function updateLiveSegment(targetLatLng) {
      const target = toLatLng(targetLatLng);
      if (trailCoords.length === 0 || !target) {
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

      if (typeof shouldFollow === 'boolean') {
        syncFollowMode(shouldFollow, target);
      } else {
        ensureMarker(target);
        if (followUser) {
          followMapTo(target);
        }
      }

      if (followUser && heading != null && Number.isFinite(Number(heading))) {
        setMapBearing(Number(heading));
      }

      updateLiveSegment(target);
    }

    function setFollowUser(value, lat, lng) {
      if (!value) {
        followUser = false;
        clearMapRotation();
        return;
      }
      recenterOnUser(lat, lng);
    }

    function recenterOnUser(lat, lng) {
      let target = null;
      if (
        lat != null &&
        lng != null &&
        Number.isFinite(Number(lat)) &&
        Number.isFinite(Number(lng))
      ) {
        target = L.latLng(Number(lat), Number(lng));
      } else if (window.__lastKnownLatLng) {
        target = window.__lastKnownLatLng;
      } else if (trailCoords.length > 0) {
        target = trailCoords[trailCoords.length - 1];
      } else if (marker) {
        target = marker.getLatLng();
      }

      if (!target) return;

      followUser = true;
      ensureMarker(target);
      clearMapRotation();
      programmaticMove = true;
      map.setView(target, ${LIVE_ZOOM}, { animate: false });
      programmaticMove = false;
      map.invalidateSize(true);

      window.requestAnimationFrame(function() {
        map.invalidateSize(true);
        if (window.__lastMapHeading != null) {
          setMapBearing(window.__lastMapHeading);
        }
      });
    }

    function updatePinPhoto(src) {
      pinPhotoSrc = src || null;
      if (!marker) return;
      marker.setIcon(createMarkerIcon());
    }

    window.__lastMapHeading = null;
    window.__lastKnownLatLng = L.latLng(${initialLatitude}, ${initialLongitude});
    ensureMarker(window.__lastKnownLatLng);

    window.updateLiveTrailMap = function(trailPoints, heading, currentLat, currentLng, shouldFollow) {
      if (heading != null && Number.isFinite(Number(heading))) {
        window.__lastMapHeading = Number(heading);
      }
      updateLiveTrailMap(trailPoints, heading, currentLat, currentLng, shouldFollow);
    };
    window.setMapBearing = setMapBearing;
    window.setFollowUser = setFollowUser;
    window.recenterOnUser = recenterOnUser;
    window.updatePinPhoto = updatePinPhoto;

    map.whenReady(function() {
      map.invalidateSize(true);
      postMessage({ type: 'mapReady' });
    });

    map.on('resize', function() {
      map.invalidateSize(true);
      if (followUser && window.__lastKnownLatLng) {
        followMapTo(window.__lastKnownLatLng);
      } else {
        applyMapRotation();
      }
    });

    map.on('dragstart', handleUserMapInteraction);
    map.on('zoomstart', handleUserMapInteraction);

    map.on('dblclick', function(event) {
      programmaticMove = true;
      map.setView(event.latlng, Math.min(map.getZoom() + 1, map.getMaxZoom()));
      programmaticMove = false;
    });
  </script>
</body>
</html>`
}

function buildStaticMapHtml(
  trail: GeoCoordinates[],
  profilePhotoDataUri: string | null,
  interactive: boolean,
) {
  const trailJson = JSON.stringify(trail.map((point) => [point.latitude, point.longitude]))
  const current = trail[trail.length - 1]
  const centerLat = current?.latitude ?? DEFAULT_CENTER.latitude
  const centerLng = current?.longitude ?? DEFAULT_CENTER.longitude
  const hasTrail = trail.length > 0
  const hasPhoto = Boolean(profilePhotoDataUri)
  const pinSize = hasPhoto ? 44 : 30
  const pinAnchor = hasPhoto ? 22 : 15
  const photoSrcJson = profilePhotoDataUri ? JSON.stringify(profilePhotoDataUri) : 'null'

  const mapOptions = interactive
    ? `{ zoomControl: false, attributionControl: false, touchZoom: true, dragging: true, doubleClickZoom: true, scrollWheelZoom: false, boxZoom: false, minZoom: 10, maxZoom: 19 }`
    : `{ zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false }`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; background: #0b0f14; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
    ${buildPinStyles(hasPhoto)}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    const map = L.map('map', ${mapOptions}).setView([${centerLat}, ${centerLng}], ${hasTrail ? 16 : 14});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

    const trailCoords = ${trailJson}.map(function(point) { return L.latLng(point[0], point[1]); });
    if (trailCoords.length > 1) {
      L.polyline(trailCoords, { color: '#22c55e', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      map.fitBounds(L.latLngBounds(trailCoords), { padding: [28, 28], maxZoom: 17 });
    }

    if (trailCoords.length > 0) {
      const last = trailCoords[trailCoords.length - 1];
      const hasPhoto = ${hasPhoto ? 'true' : 'false'};
      const pinPhotoSrc = ${photoSrcJson};
      const pinSize = ${pinSize};
      const pinAnchor = ${pinAnchor};
      const bodyClass = 'live-pin-body ' + (hasPhoto ? 'is-photo' : 'is-dot');
      const html = hasPhoto
        ? '<div class="live-pin-shell"><div class="' + bodyClass + '"><img src="' + pinPhotoSrc + '" alt="" /></div></div>'
        : '<div class="live-pin-shell"><div class="' + bodyClass + '"></div></div>';
      L.marker(last, {
        icon: L.divIcon({ className: 'live-pin-wrap', html: html, iconSize: [pinSize, pinSize], iconAnchor: [pinAnchor, pinAnchor] }),
        zIndexOffset: 1000,
      }).addTo(map);
    }

    map.whenReady(function() {
      map.invalidateSize(true);
    });

    ${
      interactive
        ? `
    function notifyMapInteraction(active) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: active ? 'mapInteractionStart' : 'mapInteractionEnd',
        }));
      }
    }

    var mapInteractionCount = 0;
    function beginMapInteraction() {
      mapInteractionCount += 1;
      if (mapInteractionCount === 1) notifyMapInteraction(true);
    }
    function endMapInteraction() {
      mapInteractionCount = Math.max(0, mapInteractionCount - 1);
      if (mapInteractionCount === 0) notifyMapInteraction(false);
    }

    map.on('dragstart', beginMapInteraction);
    map.on('zoomstart', beginMapInteraction);
    map.on('dragend', endMapInteraction);
    map.on('zoomend', endMapInteraction);

    var mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.addEventListener('touchstart', beginMapInteraction, { passive: true });
      mapElement.addEventListener('touchend', endMapInteraction, { passive: true });
      mapElement.addEventListener('touchcancel', endMapInteraction, { passive: true });
    }
    `
        : ''
    }
  </script>
</body>
</html>`
}

function buildLiveUpdateScript(
  trail: GeoCoordinates[],
  currentPosition: GeoCoordinates | null | undefined,
  followUser: boolean,
  heading: number | null,
) {
  const trailJson = JSON.stringify(trail.map((point) => [point.latitude, point.longitude]))
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
      return true;
    })();
  `
}

function buildFollowUserScript(
  followUser: boolean,
  currentPosition: GeoCoordinates | null | undefined,
) {
  const lat = currentPosition?.latitude ?? null
  const lng = currentPosition?.longitude ?? null
  const latValue = lat != null ? String(lat) : 'null'
  const lngValue = lng != null ? String(lng) : 'null'

  return `
    (function () {
      if (${followUser ? 'true' : 'false'} && typeof window.recenterOnUser === 'function') {
        window.recenterOnUser(${latValue}, ${lngValue});
        return true;
      }
      if (typeof window.setFollowUser === 'function') {
        window.setFollowUser(false, null, null);
      }
      return true;
    })();
  `
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

export function RunWalkActivityTrailMap({
  trail,
  currentPosition = null,
  height = 180,
  fullscreen = false,
  interactive = false,
  liveTracking = false,
  followUser = true,
  onUserPanned,
  onMapInteractionChange,
  profilePhotoUri,
  deviceHeadingDegrees = null,
  currentSpeedKmh = 0,
}: RunWalkActivityTrailMapProps) {
  const webViewRef = useRef<WebView>(null)
  const followUserRef = useRef(followUser)
  const smoothedHeadingRef = useRef<number | null>(null)
  const lastInjectAtRef = useRef(0)
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
    void profilePhotoToDataUri(trimmed).then((dataUri) => {
      if (active) setProfilePhotoDataUri(dataUri)
    })

    return () => {
      active = false
    }
  }, [profilePhotoUri])

  const mapOriginRef = useRef(
    currentPosition ?? trail[trail.length - 1] ?? DEFAULT_CENTER,
  )
  const initialCenter = mapOriginRef.current

  const html = useMemo(() => {
    if (liveTracking) {
      return buildLiveMapHtml({
        initialLatitude: initialCenter.latitude,
        initialLongitude: initialCenter.longitude,
        interactive: interactive || liveTracking,
        hasPhoto: false,
        photoSrcJson: 'null',
        pinSize: 30,
        pinAnchor: 15,
      })
    }

    return buildStaticMapHtml(trail, profilePhotoDataUri, interactive)
  }, [interactive, liveTracking, profilePhotoDataUri, trail])

  const injectLiveUpdate = useCallback(
    (force = false) => {
      if (!webViewRef.current) return

      const now = Date.now()
      if (!force && now - lastInjectAtRef.current < 180) return
      lastInjectAtRef.current = now

      const targetHeading = resolveLiveMapHeading(
        trail,
        deviceHeadingDegrees,
        smoothedHeadingRef.current,
        currentSpeedKmh,
      )
      const heading = smoothMapHeading(smoothedHeadingRef.current, targetHeading)
      if (heading != null) {
        smoothedHeadingRef.current = heading
      }

      webViewRef.current.injectJavaScript(
        buildLiveUpdateScript(
          trail,
          currentPosition,
          followUserRef.current,
          followUserRef.current ? heading : null,
        ),
      )
    },
    [currentPosition, currentSpeedKmh, deviceHeadingDegrees, trail],
  )

  useEffect(() => {
    setIsMapReady(false)
  }, [html])

  useEffect(() => {
    if (!liveTracking || !isMapReady) return
    injectLiveUpdate(true)
  }, [injectLiveUpdate, isMapReady, liveTracking, trail, currentPosition, followUser])

  useEffect(() => {
    if (!isMapReady || !webViewRef.current || !liveTracking) return
    webViewRef.current.injectJavaScript(buildFollowUserScript(followUser, currentPosition))
  }, [currentPosition, followUser, isMapReady, liveTracking])

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
          injectLiveUpdate(true)
        }
        if (payload.type === 'userPanned') {
          onUserPanned?.()
        }
        if (payload.type === 'mapInteractionStart') {
          onMapInteractionChange?.(true)
        }
        if (payload.type === 'mapInteractionEnd') {
          onMapInteractionChange?.(false)
        }
      } catch {
        // ignore malformed messages
      }
    },
    [injectLiveUpdate, onMapInteractionChange, onUserPanned],
  )

  return (
    <View style={[styles.wrap, fullscreen ? styles.wrapFullscreen : { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={interactive || liveTracking}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onMessage={handleWebViewMessage}
        onLoadEnd={() => injectLiveUpdate(true)}
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
