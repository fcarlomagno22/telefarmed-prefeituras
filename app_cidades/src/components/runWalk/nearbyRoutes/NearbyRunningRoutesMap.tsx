import { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import type { RunningRouteSpot, RunningRoutesOrigin } from '../../../types/nearbyRunningRoutes'

type NearbyRunningRoutesMapProps = {
  origin: RunningRoutesOrigin
  spots: RunningRouteSpot[]
  selectedId: string | null
  onSelectSpot: (id: string) => void
}

function buildNearbyRunningRoutesMapHtml({
  origin,
  spots,
  selectedId,
}: {
  origin: RunningRoutesOrigin
  spots: RunningRouteSpot[]
  selectedId: string | null
}) {
  const markers = JSON.stringify(
    spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      lat: spot.latitude,
      lng: spot.longitude,
      selected: spot.id === selectedId,
    })),
  )

  const selected = spots.find((spot) => spot.id === selectedId)
  const flyLat = selected?.latitude ?? origin.latitude
  const flyLng = selected?.longitude ?? origin.longitude
  const flyZoom = selected ? 14 : 13
  const originLabel = origin.label.replace(/'/g, "\\'")

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
      .user-pin-wrap, .spot-pin-wrap { background: transparent; border: none; }
      .user-pin {
        width: 18px; height: 18px; border-radius: 50%;
        background: #38bdf8; border: 3px solid #fff;
        box-shadow: 0 0 0 6px rgba(56,189,248,0.25), 0 4px 14px rgba(0,0,0,0.45);
        position: relative;
      }
      .user-pulse {
        position: absolute; inset: -14px; border-radius: 50%;
        border: 2px solid rgba(56,189,248,0.45);
        animation: pulse 2s ease-out infinite;
      }
      @keyframes pulse {
        0% { transform: scale(0.55); opacity: 0.9; }
        70% { transform: scale(1.15); opacity: 0; }
        100% { transform: scale(1.15); opacity: 0; }
      }
      .spot-pin {
        width: 38px; height: 38px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #ffb366, #ff6b00, #e55f00);
        border: 2px solid rgba(255,255,255,0.85);
        box-shadow: 0 6px 18px rgba(255,107,0,0.45);
        color: #fff; font-size: 15px; font-weight: 800;
      }
      .spot-pin.selected {
        transform: scale(1.12);
        box-shadow: 0 0 0 6px rgba(255,133,51,0.28), 0 10px 24px rgba(255,107,0,0.55);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      function postSelect(id) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id }));
        }
      }

      const map = L.map('map', { zoomControl: true, attributionControl: false })
        .setView([${flyLat}, ${flyLng}], ${flyZoom});

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const userIcon = L.divIcon({
        className: 'user-pin-wrap',
        html: '<div class="user-pin"><div class="user-pulse"></div></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const userMarker = L.marker([${origin.latitude}, ${origin.longitude}], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('${originLabel}', { direction: 'top', offset: [0, -10] });

      const markers = ${markers};
      const layers = [userMarker];

      markers.forEach((markerData) => {
        const icon = L.divIcon({
          className: 'spot-pin-wrap',
          html: '<div class="spot-pin ' + (markerData.selected ? 'selected' : '') + '">🏃</div>',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([markerData.lat, markerData.lng], { icon, zIndexOffset: markerData.selected ? 900 : 500 })
          .addTo(map);
        marker.bindTooltip(markerData.name, { direction: 'top', offset: [0, -16] });
        marker.on('click', () => postSelect(markerData.id));
        layers.push(marker);
      });

      if (!${selected ? 'true' : 'false'} && layers.length > 1) {
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.18));
      }
    </script>
  </body>
</html>`
}

export function NearbyRunningRoutesMap({
  origin,
  spots,
  selectedId,
  onSelectSpot,
}: NearbyRunningRoutesMapProps) {
  const webRef = useRef<WebView>(null)

  const html = useMemo(
    () => buildNearbyRunningRoutesMapHtml({ origin, spots, selectedId }),
    [origin.latitude, origin.longitude, origin.label, spots, selectedId],
  )

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string }
      if (payload.type === 'select' && payload.id) {
        onSelectSpot(payload.id)
      }
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={handleMessage}
      />
      <View style={styles.vignetteTop} pointerEvents="none" />
      <View style={styles.vignetteBottom} pointerEvents="none" />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0f14',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(10, 10, 12, 0.3)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(10, 10, 12, 0.18)',
  },
})
