import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { colors } from '../../../theme/colors'
import { StyleSheet, View } from 'react-native'
import { AppWebView, type AppWebViewRef } from '../../../adapters/AppWebView'
import {
  buildLiveShareMapParticipantPinHtml,
  buildLiveShareUpdateScript,
  getLiveShareMapInitialView,
  LIVE_SHARE_MAP_CUSTOM_CSS,
  LIVE_SHARE_MAP_LEAFLET_CSS_URL,
  LIVE_SHARE_MAP_LEAFLET_JS_URL,
  LIVE_SHARE_MAP_TILE_URL,
  liveSharePointsToTrail,
  type LiveLocationTrackingMapProps,
} from './liveLocationTrackingMapShared'

function buildLiveLocationTrackingMapHtml({
  points,
  participantPinHtml,
  bottomInsetPx,
  topInsetPx,
}: {
  points: LiveLocationTrackingMapProps['points']
  participantPinHtml: string
  bottomInsetPx: number
  topInsetPx: number
}) {
  const trail = JSON.stringify(liveSharePointsToTrail(points))
  const { centerLat, centerLng, zoom: initialZoom } = getLiveShareMapInitialView(points)

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="${LIVE_SHARE_MAP_LEAFLET_CSS_URL}" crossorigin="" />
    <style>${LIVE_SHARE_MAP_CUSTOM_CSS}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="${LIVE_SHARE_MAP_LEAFLET_JS_URL}" crossorigin=""></script>
    <script>
      const map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: false,
        minZoom: 10,
        maxZoom: 19,
      }).setView([${centerLat}, ${centerLng}], ${initialZoom});

      L.tileLayer('${LIVE_SHARE_MAP_TILE_URL}', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      let polyline = null;
      let marker = null;
      let followUser = true;
      let bottomInsetPx = ${bottomInsetPx};
      let topInsetPx = ${topInsetPx};
      const trailPoints = ${trail};

      function focusParticipantInVisibleArea() {
        const offsetY = Math.max(0, Math.round((bottomInsetPx - topInsetPx) / 2));
        if (offsetY > 0) map.panBy([0, offsetY], { animate: false });
      }

      function resetTrail(trail) {
        if (polyline) {
          map.removeLayer(polyline);
          polyline = null;
        }
        if (trail.length > 1) {
          polyline = L.polyline(trail, {
            color: '#22c55e',
            weight: 4,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
        }
      }

      function ensureMarker(latlng) {
        const icon = L.divIcon({
          className: 'live-pin-wrap',
          html: ${JSON.stringify(participantPinHtml)},
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        if (!marker) {
          marker = L.marker(latlng, { icon, zIndexOffset: 1000 }).addTo(map);
          return;
        }

        marker.setLatLng(latlng);
      }

      function centerOnParticipant(latlng) {
        if (!latlng) return;
        map.setView(latlng, Math.max(map.getZoom(), 16), { animate: false });
        focusParticipantInVisibleArea();
      }

      function updateLiveShareMap(trail, nextBottomInset, nextTopInset) {
        if (typeof nextBottomInset === 'number') bottomInsetPx = nextBottomInset;
        if (typeof nextTopInset === 'number') topInsetPx = nextTopInset;

        resetTrail(trail);
        if (trail.length === 0) return;

        const latest = trail[trail.length - 1];
        const latlng = L.latLng(latest[0], latest[1]);
        ensureMarker(latlng);

        if (followUser) centerOnParticipant(latlng);
      }

      window.updateLiveShareMap = updateLiveShareMap;
      window.recenterLiveShareMap = function() {
        followUser = true;
        if (trailPoints.length === 0) return;
        const latest = trailPoints[trailPoints.length - 1];
        centerOnParticipant(L.latLng(latest[0], latest[1]));
      };
      window.setLiveShareFollowUser = function(value) {
        followUser = !!value;
      };

      map.on('dragstart', function() { followUser = false; });

      updateLiveShareMap(trailPoints, bottomInsetPx, topInsetPx);

      map.whenReady(function() {
        map.invalidateSize();
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
        }
      });
    </script>
  </body>
</html>`
}

export function LiveLocationTrackingMap({
  points,
  participantLabel,
  participantName,
  participantPhotoUrl,
  activityLabel,
  fullscreen = false,
  bottomInsetPx = 220,
  topInsetPx = 56,
}: LiveLocationTrackingMapProps) {
  const webViewRef = useRef<AppWebViewRef>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const participantPinHtml = buildLiveShareMapParticipantPinHtml(
    participantName,
    participantPhotoUrl,
  )

  const html = useMemo(
    () =>
      buildLiveLocationTrackingMapHtml({
        points,
        participantPinHtml,
        bottomInsetPx,
        topInsetPx,
      }),
    [bottomInsetPx, participantPinHtml, points, topInsetPx],
  )

  const injectUpdate = useCallback(() => {
    if (!webViewRef.current) return
    webViewRef.current.injectJavaScript(
      buildLiveShareUpdateScript(points, bottomInsetPx, topInsetPx),
    )
  }, [bottomInsetPx, points, topInsetPx])

  useEffect(() => {
    setIsMapReady(false)
  }, [html])

  useEffect(() => {
    if (!isMapReady) return
    injectUpdate()
  }, [injectUpdate, isMapReady])

  return (
    <View style={[styles.wrap, fullscreen && styles.wrapFullscreen]}>
      <AppWebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as { type?: string }
            if (payload.type === 'mapReady') setIsMapReady(true)
          } catch {
            // ignore
          }
        }}
        mixedContentMode="always"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 280,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    backgroundColor: colors.background,
  },
  wrapFullscreen: {
    minHeight: undefined,
    borderRadius: 0,
    borderWidth: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
