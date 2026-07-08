import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { colors } from '../../../theme/colors'
import { StyleSheet, View } from 'react-native'
import { AppWebView, type AppWebViewRef, type WebViewMessageEvent } from '../../../adapters/AppWebView'
import {
  resolveLiveMapHeading,
  smoothMapHeading,
} from '../../../utils/mapHeadingSmoothing'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import type { GeoCoordinates } from '../../../utils/geo'
import {
  buildTrailMapPinStyles,
  parseTrailMapWebViewMessage,
  TRAIL_MAP_BASE_CSS,
  TRAIL_MAP_DEFAULT_CENTER,
  TRAIL_MAP_LEAFLET_CSS_URL,
  TRAIL_MAP_LEAFLET_JS_URL,
  TRAIL_MAP_LIVE_ZOOM,
  TRAIL_MAP_LIVE_FOLLOW_JS,
  TRAIL_MAP_TILE_URL,
  buildLivePositionUpdateScript,
  buildLiveTrailAppendScript,
  buildLiveTrailResyncScript,
  buildTrailSignature,
  trailToLatLngPairs,
  type RunWalkActivityTrailMapProps,
} from './runWalkActivityTrailMapShared'
import { useRunWalkLiveMapFeedSync } from './useRunWalkLiveMapFeedSync'
import { RunWalkLiveMapWebViewInjector } from './runWalkLiveMapWebViewInjector'

function buildLiveMapBridgeScript(
  trail: GeoCoordinates[],
  currentPosition: GeoCoordinates | null | undefined,
  heading: number | null,
  lastTrailPointCountRef: { current: number },
  trailChanged: boolean,
): string {
  if (!trailChanged) {
    return buildLivePositionUpdateScript(currentPosition, heading)
  }

  const trailLength = trail.length

  if (trailLength < lastTrailPointCountRef.current) {
    lastTrailPointCountRef.current = trailLength
    return buildLiveTrailResyncScript(trail, currentPosition, heading)
  }

  if (trailLength > lastTrailPointCountRef.current) {
    const newPoints = trailToLatLngPairs(trail.slice(lastTrailPointCountRef.current))
    lastTrailPointCountRef.current = trailLength

    if (newPoints.length === 0) {
      return buildLivePositionUpdateScript(currentPosition, heading)
    }

    return buildLiveTrailAppendScript(newPoints, currentPosition, heading)
  }

  return buildLiveTrailResyncScript(trail, currentPosition, heading)
}

function buildPinStyles(hasPhoto: boolean) {
  return buildTrailMapPinStyles(hasPhoto)
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
  <link rel="stylesheet" href="${TRAIL_MAP_LEAFLET_CSS_URL}" crossorigin="" />
  <style>
    ${TRAIL_MAP_BASE_CSS}
    ${buildPinStyles(hasPhoto)}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="${TRAIL_MAP_LEAFLET_JS_URL}" crossorigin=""></script>
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
    }).setView([${initialLatitude}, ${initialLongitude}], ${TRAIL_MAP_LIVE_ZOOM});

    L.tileLayer('${TRAIL_MAP_TILE_URL}', {
      maxZoom: 19,
      subdomains: 'abcd',
      updateWhenIdle: true,
      keepBuffer: 4,
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

    ${TRAIL_MAP_LIVE_FOLLOW_JS}

    function followMapTo(latlng, forceZoom) {
      if (!followUser || !latlng) return;
      followTargetLatLng = latlng;
      if (followAnimFrame == null) {
        followAnimFrame = requestAnimationFrame(tickFollowAnimation);
      }
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
      cancelFollowAnimation();
      clearMapRotation();
      postMessage({ type: 'userPanned' });
    }

    function updateLiveSegment(targetLatLng) {
      const target = toLatLng(targetLatLng);
      if (!target) {
        if (liveSegment) {
          map.removeLayer(liveSegment);
          liveSegment = null;
        }
        return;
      }

      const lastCommitted =
        trailCoords.length > 0 ? trailCoords[trailCoords.length - 1] : target;
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

    function appendNewTrailPoints(trailPoints) {
      const normalized = normalizeTrail(trailPoints);
      if (normalized.length === 0) return;

      if (!polyline) {
        polyline = L.polyline(normalized, {
          color: '#22c55e',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        normalized.forEach(function(point) {
          polyline.addLatLng(point);
        });
      }

      trailCoords = trailCoords.concat(normalized);
      if (liveSegment) {
        map.removeLayer(liveSegment);
        liveSegment = null;
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
      if (newPoints.length > 0 && liveSegment) {
        map.removeLayer(liveSegment);
        liveSegment = null;
      }
    }

    function applyLiveViewTarget(target, heading) {
      if (!target) return;

      ensureMarker(target);
      if (followUser) {
        followMapTo(target);
      }

      if (followUser && heading != null && Number.isFinite(Number(heading))) {
        setMapBearing(Number(heading));
      } else if (followUser && heading == null) {
        clearMapRotation();
      }

      updateLiveSegment(target);
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
        if (!shouldFollow) return;
      }

      applyLiveViewTarget(target, heading);
    }

    function updateLivePosition(currentLat, currentLng, heading) {
      const hasCurrent =
        currentLat != null &&
        currentLng != null &&
        Number.isFinite(Number(currentLat)) &&
        Number.isFinite(Number(currentLng));

      if (!hasCurrent) return;

      applyLiveViewTarget(L.latLng(Number(currentLat), Number(currentLng)), heading);
    }

    function appendLiveTrailPoints(newPoints, heading, currentLat, currentLng) {
      appendNewTrailPoints(newPoints);

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

      applyLiveViewTarget(target, heading);
    }

    function setFollowUser(value, lat, lng) {
      if (!value) {
        followUser = false;
        cancelFollowAnimation();
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

      cancelFollowAnimation();
      followUser = true;
      ensureMarker(target);
      followTargetLatLng = target;
      programmaticMove = true;
      map.setView(target, ${TRAIL_MAP_LIVE_ZOOM}, { animate: false });
      programmaticMove = false;
      applyMapRotation();

      window.requestAnimationFrame(function() {
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
    window.updateLivePosition = function(currentLat, currentLng, heading) {
      if (heading != null && Number.isFinite(Number(heading))) {
        window.__lastMapHeading = Number(heading);
      }
      updateLivePosition(currentLat, currentLng, heading);
    };
    window.appendLiveTrailPoints = function(newPoints, heading, currentLat, currentLng) {
      if (heading != null && Number.isFinite(Number(heading))) {
        window.__lastMapHeading = Number(heading);
      }
      appendLiveTrailPoints(newPoints, heading, currentLat, currentLng);
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
  const centerLat = current?.latitude ?? TRAIL_MAP_DEFAULT_CENTER.latitude
  const centerLng = current?.longitude ?? TRAIL_MAP_DEFAULT_CENTER.longitude
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
  <link rel="stylesheet" href="${TRAIL_MAP_LEAFLET_CSS_URL}" crossorigin="" />
  <style>
    ${TRAIL_MAP_BASE_CSS}
    ${buildPinStyles(hasPhoto)}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="${TRAIL_MAP_LEAFLET_JS_URL}" crossorigin=""></script>
  <script>
    const map = L.map('map', ${mapOptions}).setView([${centerLat}, ${centerLng}], ${hasTrail ? 16 : 14});
    L.tileLayer('${TRAIL_MAP_TILE_URL}', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

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

export const RunWalkActivityTrailMap = memo(function RunWalkActivityTrailMap({
  trail,
  currentPosition = null,
  liveGpsFeed = null,
  mapTrailFeed = null,
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
  rotateWithHeading = false,
}: RunWalkActivityTrailMapProps) {
  const usesLiveFeed = Boolean(liveTracking && liveGpsFeed && mapTrailFeed)
  const webViewRef = useRef<AppWebViewRef>(null)
  const webViewInjectorRef = useRef<RunWalkLiveMapWebViewInjector | null>(null)
  if (!webViewInjectorRef.current) {
    webViewInjectorRef.current = new RunWalkLiveMapWebViewInjector(() => webViewRef.current)
  }
  const followUserRef = useRef(followUser)
  const currentPositionRef = useRef(currentPosition)
  const rotateWithHeadingRef = useRef(rotateWithHeading)
  const smoothedHeadingRef = useRef<number | null>(null)
  const lastTrailPointCountRef = useRef(0)
  const lastTrailSignatureRef = useRef('')
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const scheduleInject = useCallback((script: string, force = false) => {
    webViewInjectorRef.current?.schedule(script, { force })
  }, [])

  useEffect(() => {
    followUserRef.current = followUser
  }, [followUser])

  useEffect(() => {
    currentPositionRef.current = currentPosition
  }, [currentPosition])

  useEffect(() => {
    rotateWithHeadingRef.current = rotateWithHeading
  }, [rotateWithHeading])

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
    currentPosition ?? trail[trail.length - 1] ?? TRAIL_MAP_DEFAULT_CENTER,
  )
  const initialCenter = mapOriginRef.current

  const staticTrailSignature = useMemo(
    () => trail.map((point) => `${point.latitude},${point.longitude}`).join('|'),
    [trail],
  )

  const mapMountSignature = liveTracking
    ? `live:${interactive}:${initialCenter.latitude}:${initialCenter.longitude}`
    : `static:${interactive}:${profilePhotoDataUri ?? ''}:${staticTrailSignature}`

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
  }, [interactive, initialCenter.latitude, initialCenter.longitude, liveTracking, profilePhotoDataUri, staticTrailSignature, trail])

  const webViewSource = useMemo(() => ({ html }), [html])

  const injectMapPayload = useCallback(
    (
      payload: {
        trail: typeof trail
        currentPosition: typeof currentPosition
        heading: number | null
        trailChanged: boolean
      },
      force = false,
    ) => {
      const script = buildLiveMapBridgeScript(
        payload.trail,
        payload.currentPosition,
        payload.heading,
        lastTrailPointCountRef,
        payload.trailChanged,
      )

      if (payload.trailChanged) {
        lastTrailSignatureRef.current = buildTrailSignature(payload.trail)
      }

      scheduleInject(script, force)
    },
    [scheduleInject],
  )

  const injectLiveUpdate = useCallback(
    (force = false) => {
      if (usesLiveFeed) return

      const targetHeading = rotateWithHeadingRef.current
        ? resolveLiveMapHeading(
            trail,
            deviceHeadingDegrees,
            smoothedHeadingRef.current,
            currentSpeedKmh,
          )
        : null
      const heading =
        rotateWithHeadingRef.current && followUserRef.current
          ? smoothMapHeading(smoothedHeadingRef.current, targetHeading)
          : null
      if (heading != null) {
        smoothedHeadingRef.current = heading
      } else if (!rotateWithHeadingRef.current) {
        smoothedHeadingRef.current = null
      }

      const trailSignature = buildTrailSignature(trail)
      const trailChanged = trailSignature !== lastTrailSignatureRef.current
      if (trailChanged) {
        lastTrailSignatureRef.current = trailSignature
      }

      const script = buildLiveMapBridgeScript(
        trail,
        currentPosition,
        heading,
        lastTrailPointCountRef,
        trailChanged,
      )

      scheduleInject(script, force)
    },
    [currentPosition, currentSpeedKmh, deviceHeadingDegrees, scheduleInject, trail, usesLiveFeed],
  )

  useRunWalkLiveMapFeedSync({
    enabled: usesLiveFeed && isMapReady,
    liveGpsFeed,
    mapTrailFeed,
    rotateWithHeading,
    followUser,
    onUpdate: (payload) => injectMapPayload(payload),
  })

  useEffect(() => {
    setIsMapReady(false)
    lastTrailPointCountRef.current = 0
    lastTrailSignatureRef.current = ''
    webViewInjectorRef.current?.reset()
  }, [mapMountSignature])

  useEffect(() => {
    if (usesLiveFeed || !liveTracking || !isMapReady) return
    injectLiveUpdate(true)
  }, [injectLiveUpdate, isMapReady, liveTracking, usesLiveFeed])

  useEffect(() => {
    if (!isMapReady || !liveTracking || !webViewRef.current) return

    if (followUser) {
      const position = currentPositionRef.current
      webViewRef.current.injectJavaScript(buildFollowUserScript(true, position))
      return
    }

    webViewRef.current.injectJavaScript(buildFollowUserScript(false, null))
  }, [followUser, isMapReady, liveTracking])

  useEffect(() => {
    if (!isMapReady || !liveTracking || !webViewRef.current) return
    webViewRef.current.injectJavaScript(buildPinPhotoUpdateScript(profilePhotoDataUri))
  }, [isMapReady, liveTracking, profilePhotoDataUri])

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const payload = parseTrailMapWebViewMessage(event.nativeEvent.data)
      if (!payload) return

      if (payload.type === 'mapReady') {
        setIsMapReady(true)
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
    },
    [onMapInteractionChange, onUserPanned],
  )

  return (
    <View style={[styles.wrap, fullscreen ? styles.wrapFullscreen : { height }]}>
      <AppWebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled={interactive || liveTracking}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onMessage={handleWebViewMessage}
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    backgroundColor: colors.background,
  },
  wrapFullscreen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
