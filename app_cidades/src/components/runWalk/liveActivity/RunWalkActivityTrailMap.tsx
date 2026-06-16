import { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { GeoCoordinates } from '../../../utils/geo'

type RunWalkActivityTrailMapProps = {
  trail: GeoCoordinates[]
  height?: number
  fullscreen?: boolean
}

function buildTrailMapHtml(trail: GeoCoordinates[]) {
  const trailJson = JSON.stringify(trail.map((point) => [point.latitude, point.longitude]))
  const current = trail[trail.length - 1]
  const centerLat = current?.latitude ?? -23.5505
  const centerLng = current?.longitude ?? -46.6333
  const hasTrail = trail.length > 0

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; background: #0b0f14; }
      .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
      .live-pin-wrap { background: transparent; border: none; }
      .live-pin {
        width: 16px; height: 16px; border-radius: 50%;
        background: #22c55e; border: 3px solid #fff;
        box-shadow: 0 0 0 5px rgba(34,197,94,0.22);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView([${centerLat}, ${centerLng}], ${hasTrail ? 16 : 14});

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const trailPoints = ${trailJson};

      if (trailPoints.length > 1) {
        const polyline = L.polyline(trailPoints, {
          color: '#22c55e',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [28, 28], maxZoom: 17 });
      }

      if (trailPoints.length > 0) {
        const last = trailPoints[trailPoints.length - 1];
        const icon = L.divIcon({
          className: 'live-pin-wrap',
          html: '<div class="live-pin"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker(last, { icon, zIndexOffset: 1000 }).addTo(map);

        if (trailPoints.length === 1) {
          map.setView(last, 16);
        }
      }
    </script>
  </body>
</html>`
}

export function RunWalkActivityTrailMap({
  trail,
  height = 180,
  fullscreen = false,
}: RunWalkActivityTrailMapProps) {
  const webViewRef = useRef<WebView>(null)

  const html = useMemo(() => buildTrailMapHtml(trail), [trail])

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
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
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
