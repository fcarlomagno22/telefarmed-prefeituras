import { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppWebView, type AppWebViewRef, type WebViewMessageEvent } from '../../adapters/AppWebView'
import {
  buildNearbyUnitsMapMarkers,
  getNearbyUnitsMapView,
  NEARBY_UNITS_LEAFLET_CSS_URL,
  NEARBY_UNITS_LEAFLET_JS_URL,
  NEARBY_UNITS_MAP_CUSTOM_CSS,
  NEARBY_UNITS_TILE_URL,
  type NearbyUnitsMapProps,
} from './nearbyUnitsMapShared'

function buildNearbyUnitsMapHtml({
  origin,
  ubts,
  selectedId,
}: NearbyUnitsMapProps) {
  const markers = JSON.stringify(buildNearbyUnitsMapMarkers(ubts, selectedId))
  const { flyLat, flyLng, flyZoom, hasSelection } = getNearbyUnitsMapView(origin, ubts, selectedId)
  const originLabel = origin.label.replace(/'/g, "\\'")

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="${NEARBY_UNITS_LEAFLET_CSS_URL}" crossorigin="" />
    <style>${NEARBY_UNITS_MAP_CUSTOM_CSS}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="${NEARBY_UNITS_LEAFLET_JS_URL}" crossorigin=""></script>
    <script>
      function postSelect(id) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id }));
        }
      }

      const map = L.map('map', { zoomControl: true, attributionControl: false })
        .setView([${flyLat}, ${flyLng}], ${flyZoom});

      L.tileLayer('${NEARBY_UNITS_TILE_URL}', {
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

      let routeLine = null;
      const markers = ${markers};
      const layers = [userMarker];

      markers.forEach((markerData) => {
        const icon = L.divIcon({
          className: 'ubt-pin-wrap',
          html: '<div class="ubt-pin ' + (markerData.selected ? 'selected' : '') + ' ' + (markerData.open ? '' : 'closed') + '">+</div>',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([markerData.lat, markerData.lng], { icon, zIndexOffset: markerData.selected ? 900 : 500 })
          .addTo(map);
        marker.bindTooltip(markerData.name, { direction: 'top', offset: [0, -16] });
        marker.on('click', () => postSelect(markerData.id));
        layers.push(marker);

        if (markerData.selected) {
          if (routeLine) map.removeLayer(routeLine);
          routeLine = L.polyline(
            [[${origin.latitude}, ${origin.longitude}], [markerData.lat, markerData.lng]],
            { color: '#ff8533', weight: 3, opacity: 0.85, dashArray: '6 8' },
          ).addTo(map);
        }
      });

      if (!${hasSelection ? 'true' : 'false'} && layers.length > 1) {
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    </script>
  </body>
</html>`
}

export function NearbyUnitsMap({ origin, ubts, selectedId, onSelectUbt }: NearbyUnitsMapProps) {
  const webRef = useRef<AppWebViewRef>(null)

  const html = useMemo(
    () => buildNearbyUnitsMapHtml({ origin, ubts, selectedId, onSelectUbt }),
    [origin.latitude, origin.longitude, origin.label, ubts, selectedId, onSelectUbt],
  )

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string }
      if (payload.type === 'select' && payload.id) {
        onSelectUbt(payload.id)
      }
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={styles.wrap}>
      <AppWebView
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
    height: 120,
    backgroundColor: 'rgba(10, 10, 12, 0.35)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(10, 10, 12, 0.2)',
  },
})
