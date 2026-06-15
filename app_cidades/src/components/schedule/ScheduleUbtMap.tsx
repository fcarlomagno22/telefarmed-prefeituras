import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { colors } from '../../theme/colors'
import { ScheduleUbtWithDistance } from '../../types/scheduleUbt'
import { GeoCoordinates } from '../../utils/geo'

type ScheduleUbtMapProps = {
  home: GeoCoordinates
  ubts: ScheduleUbtWithDistance[]
  selectedId: string
  onSelectUbt: (id: string) => void
}

function buildOpenStreetMapHtml({
  home,
  ubts,
  selectedId,
}: {
  home: GeoCoordinates
  ubts: ScheduleUbtWithDistance[]
  selectedId: string
}) {
  const markers = JSON.stringify(
    ubts.map((ubt) => ({
      id: ubt.id,
      name: ubt.name,
      lat: ubt.latitude,
      lng: ubt.longitude,
      selected: ubt.id === selectedId,
    })),
  )

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body { width: 100%; height: 100%; margin: 0; background: #e8edf2; }
      #map-wrap { width: 100%; height: 100%; position: relative; }
      #map { width: 100%; height: 100%; }
      .leaflet-control-attribution { display: none !important; }
      #layer-switch {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        gap: 3px;
        padding: 4px;
        border-radius: 12px;
        background: rgba(14, 14, 20, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      }
      .layer-btn {
        border: none;
        border-radius: 8px;
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 700;
        color: rgba(245, 245, 247, 0.72);
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .layer-btn.active {
        color: #fff;
        background: linear-gradient(135deg, #ff8533, #ff6b00);
        box-shadow: 0 2px 8px rgba(255, 107, 0, 0.45);
      }
    </style>
  </head>
  <body>
    <div id="map-wrap">
      <div id="map"></div>
      <div id="layer-switch">
        <button type="button" class="layer-btn active" data-layer="street">Mapa</button>
        <button type="button" class="layer-btn" data-layer="satellite">Satélite</button>
        <button type="button" class="layer-btn" data-layer="hybrid">Híbrido</button>
      </div>
    </div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      function postSelect(id) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id }));
        }
      }

      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
      }).setView([${home.latitude}, ${home.longitude}], 12);

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      });

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 },
      );

      const labelsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.92 },
      );

      let activeOverlay = null;
      let activeMode = 'street';

      streetLayer.addTo(map);

      function clearBaseLayers() {
        if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
        if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        if (activeOverlay && map.hasLayer(activeOverlay)) {
          map.removeLayer(activeOverlay);
          activeOverlay = null;
        }
      }

      function setMapLayer(mode) {
        if (activeMode === mode) return;
        activeMode = mode;
        clearBaseLayers();

        if (mode === 'street') {
          streetLayer.addTo(map);
        } else if (mode === 'satellite') {
          satelliteLayer.addTo(map);
        } else {
          satelliteLayer.addTo(map);
          activeOverlay = labelsLayer;
          activeOverlay.addTo(map);
        }

        document.querySelectorAll('.layer-btn').forEach((button) => {
          button.classList.toggle('active', button.dataset.layer === mode);
        });
      }

      document.querySelectorAll('.layer-btn').forEach((button) => {
        button.addEventListener('click', () => setMapLayer(button.dataset.layer));
      });

      const layers = [];

      const homeMarker = L.circleMarker([${home.latitude}, ${home.longitude}], {
        radius: 10,
        fillColor: '#4dabf7',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
      homeMarker.bindTooltip('Sua casa', { direction: 'top', offset: [0, -8] });
      layers.push(homeMarker);

      const markers = ${markers};
      markers.forEach((markerData) => {
        const marker = L.circleMarker([markerData.lat, markerData.lng], {
          radius: markerData.selected ? 12 : 9,
          fillColor: markerData.selected ? '#ff8533' : '#ff6b00',
          color: markerData.selected ? '#ffffff' : '#ffd4a8',
          weight: markerData.selected ? 3 : 2,
          fillOpacity: 0.92,
        }).addTo(map);

        marker.bindTooltip(markerData.name, { direction: 'top', offset: [0, -8] });
        marker.on('click', () => postSelect(markerData.id));
        layers.push(marker);
      });

      if (layers.length > 1) {
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.18));
      } else {
        map.setZoom(13);
      }
    </script>
  </body>
</html>`
}

export function ScheduleUbtMap({ home, ubts, selectedId, onSelectUbt }: ScheduleUbtMapProps) {
  const html = useMemo(
    () =>
      buildOpenStreetMapHtml({
        home,
        ubts,
        selectedId,
      }),
    [home.latitude, home.longitude, ubts, selectedId],
  )

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        nestedScrollEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string }
            if (payload.type === 'select' && payload.id) {
              onSelectUbt(payload.id)
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendHome]} />
          <Text style={styles.legendText}>Sua casa</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendUbt]} />
          <Text style={styles.legendText}>UBTs</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
    backgroundColor: 'rgba(14, 14, 20, 0.9)',
  },
  webview: {
    height: 220,
    backgroundColor: '#e8edf2',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(10, 10, 12, 0.92)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  legendHome: {
    backgroundColor: '#4dabf7',
  },
  legendUbt: {
    backgroundColor: colors.primary,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})
