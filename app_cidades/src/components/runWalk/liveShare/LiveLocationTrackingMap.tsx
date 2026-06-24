import { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { LiveSharePoint } from '../../../types/runWalkLiveShare'

type LiveLocationTrackingMapProps = {
  points: LiveSharePoint[]
  participantLabel: string
  activityLabel: string
  fullscreen?: boolean
}

function buildLiveLocationTrackingMapHtml({
  points,
  participantLabel,
  activityLabel,
}: {
  points: LiveSharePoint[]
  participantLabel: string
  activityLabel: string
}) {
  const trail = JSON.stringify(
    points.map((point) => [point.latitude, point.longitude]),
  )
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
    <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #0b0f14; }
      .leaflet-control-attribution { display: none !important; }
      .leaflet-control-zoom a {
        background: rgba(14, 14, 20, 0.92) !important;
        color: #f5f5f7 !important;
        border-color: rgba(255,255,255,0.12) !important;
      }
      .live-pin-wrap { background: transparent; border: none; }
      .live-pin {
        width: 20px; height: 20px; border-radius: 50%;
        background: #22c55e; border: 3px solid #fff;
        box-shadow: 0 0 0 6px rgba(34,197,94,0.25), 0 4px 14px rgba(0,0,0,0.45);
        position: relative;
      }
      .live-pulse {
        position: absolute; inset: -14px; border-radius: 50%;
        border: 2px solid rgba(34,197,94,0.45);
        animation: pulse 2s ease-out infinite;
      }
      @keyframes pulse {
        0% { transform: scale(0.55); opacity: 0.9; }
        70% { transform: scale(1.15); opacity: 0; }
        100% { transform: scale(1.15); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const map = L.map('map', { zoomControl: true, attributionControl: false })
        .setView([${centerLat}, ${centerLng}], ${hasTrail ? 15 : 13});

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const trailPoints = ${trail};
      let polyline = null;
      let marker = null;

      if (trailPoints.length > 1) {
        polyline = L.polyline(trailPoints, {
          color: '#ff8533',
          weight: 5,
          opacity: 0.92,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      }

      if (trailPoints.length > 0) {
        const last = trailPoints[trailPoints.length - 1];
        const icon = L.divIcon({
          className: 'live-pin-wrap',
          html: '<div class="live-pin"><div class="live-pulse"></div></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        marker = L.marker(last, { icon, zIndexOffset: 1000 })
          .addTo(map)
          .bindTooltip('${safeParticipant}<br/>${safeActivity}', {
            direction: 'top',
            offset: [0, -12],
            permanent: false,
          });

        if (polyline) {
          map.fitBounds(polyline.getBounds(), { padding: [48, 48], maxZoom: 16 });
        } else {
          map.setView(last, 16);
        }
      }
    </script>
  </body>
</html>`
}

export function LiveLocationTrackingMap({
  points,
  participantLabel,
  activityLabel,
  fullscreen = false,
}: LiveLocationTrackingMapProps) {
  const webViewRef = useRef<WebView>(null)

  const html = useMemo(
    () =>
      buildLiveLocationTrackingMapHtml({
        points,
        participantLabel,
        activityLabel,
      }),
    [activityLabel, participantLabel, points],
  )

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
    borderColor: 'rgba(34, 197, 94, 0.22)',
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
