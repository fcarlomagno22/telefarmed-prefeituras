import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { LiveSharePoint } from '../../../types/runWalkLiveShare'

type LiveLocationTrackingMapProps = {
  points: LiveSharePoint[]
  participantLabel: string
  activityLabel: string
  fullscreen?: boolean
  bottomInsetPx?: number
  topInsetPx?: number
}

function buildLiveLocationTrackingMapHtml({
  points,
  participantLabel,
  activityLabel,
  bottomInsetPx,
  topInsetPx,
}: {
  points: LiveSharePoint[]
  participantLabel: string
  activityLabel: string
  bottomInsetPx: number
  topInsetPx: number
}) {
  const trail = JSON.stringify(points.map((point) => [point.latitude, point.longitude]))
  const current = points[points.length - 1]
  const centerLat = current?.latitude ?? -23.5505
  const centerLng = current?.longitude ?? -46.6333
  const hasTrail = points.length > 0
  const safeParticipant = participantLabel.replace(/'/g, "\\'")
  const safeActivity = activityLabel.replace(/'/g, "\\'")

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #0b0f14; touch-action: none; }
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
        animation: live-pin-pulse 2s ease-out infinite; pointer-events: none; z-index: 0;
      }
      @keyframes live-pin-pulse {
        0% { transform: scale(0.7); opacity: 0.85; }
        70% { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
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
      }).setView([${centerLat}, ${centerLng}], ${hasTrail ? 16 : 14});

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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
          html: '<div class="live-pin-shell"><div class="live-pin-pulse"></div><div class="live-pin-body"></div></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
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

function buildLiveShareUpdateScript(
  points: LiveSharePoint[],
  bottomInsetPx: number,
  topInsetPx: number,
) {
  const trail = JSON.stringify(points.map((point) => [point.latitude, point.longitude]))
  return `
    (function () {
      if (typeof window.updateLiveShareMap !== 'function') return true;
      window.updateLiveShareMap(${trail}, ${bottomInsetPx}, ${topInsetPx});
      return true;
    })();
  `
}

export function LiveLocationTrackingMap({
  points,
  participantLabel,
  activityLabel,
  fullscreen = false,
  bottomInsetPx = 220,
  topInsetPx = 56,
}: LiveLocationTrackingMapProps) {
  const webViewRef = useRef<WebView>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const html = useMemo(
    () =>
      buildLiveLocationTrackingMapHtml({
        points,
        participantLabel,
        activityLabel,
        bottomInsetPx,
        topInsetPx,
      }),
    [activityLabel, bottomInsetPx, participantLabel, points, topInsetPx],
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
      <WebView
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
    backgroundColor: '#0b0f14',
  },
  wrapFullscreen: {
    minHeight: undefined,
    borderRadius: 0,
    borderWidth: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
})
