import { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

type RunningRouteSpotPickerMapProps = {
  initialLatitude: number
  initialLongitude: number
  initialZoom?: number
  initialPin?: { latitude: number; longitude: number } | null
  userLocation?: { latitude: number; longitude: number } | null
  onPick: (coords: { latitude: number; longitude: number }) => void
}

function buildPickerMapHtml(
  initialLatitude: number,
  initialLongitude: number,
  initialZoom: number,
  pinLatitude: number | null,
  pinLongitude: number | null,
  userLatitude: number | null,
  userLongitude: number | null,
): string {
  const pinLat = pinLatitude ?? 'null'
  const pinLng = pinLongitude ?? 'null'
  const userLat = userLatitude ?? 'null'
  const userLng = userLongitude ?? 'null'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0e0e14; }
    .leaflet-container { background: #0e0e14; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .pick-marker {
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: #ff8533;
      border: 3px solid #fff;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(255, 107, 0, 0.45);
    }
    .pick-marker::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8px;
      height: 8px;
      margin: -4px 0 0 -4px;
      border-radius: 50%;
      background: #fff;
    }
    .user-pin {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #38bdf8;
      border: 3px solid #fff;
      box-shadow: 0 0 0 6px rgba(56,189,248,0.25), 0 4px 14px rgba(0,0,0,0.45);
      position: relative;
    }
    .user-pulse {
      position: absolute;
      inset: -14px;
      border-radius: 50%;
      border: 2px solid rgba(56,189,248,0.45);
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
  <script>
    const initialLat = ${initialLatitude};
    const initialLng = ${initialLongitude};
    const initialZoom = ${initialZoom};
    const initialPinLat = ${pinLat};
    const initialPinLng = ${pinLng};
    const userLat = ${userLat};
    const userLng = ${userLng};

    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pickIcon = L.divIcon({
      className: '',
      html: '<div class="pick-marker"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pin"><div class="user-pulse"></div></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    let pickMarker = null;

    function postPick(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pick',
          latitude: lat,
          longitude: lng,
        }));
      }
    }

    function setPickMarker(lat, lng) {
      if (pickMarker) {
        pickMarker.setLatLng([lat, lng]);
      } else {
        pickMarker = L.marker([lat, lng], { icon: pickIcon, draggable: true }).addTo(map);
        pickMarker.on('dragend', function() {
          const pos = pickMarker.getLatLng();
          postPick(pos.lat, pos.lng);
        });
      }
      postPick(lat, lng);
    }

    if (userLat !== null && userLng !== null) {
      L.marker([userLat, userLng], { icon: userIcon, interactive: false }).addTo(map);
    }

    if (initialPinLat !== null && initialPinLng !== null) {
      setPickMarker(initialPinLat, initialPinLng);
    }

    map.on('click', function(event) {
      setPickMarker(event.latlng.lat, event.latlng.lng);
    });
  </script>
</body>
</html>`
}

export function RunningRouteSpotPickerMap({
  initialLatitude,
  initialLongitude,
  initialZoom = 16,
  initialPin = null,
  userLocation = null,
  onPick,
}: RunningRouteSpotPickerMapProps) {
  const webViewRef = useRef<WebView>(null)

  const html = useMemo(
    () =>
      buildPickerMapHtml(
        initialLatitude,
        initialLongitude,
        initialZoom,
        initialPin?.latitude ?? null,
        initialPin?.longitude ?? null,
        userLocation?.latitude ?? null,
        userLocation?.longitude ?? null,
      ),
    [
      initialLatitude,
      initialLongitude,
      initialZoom,
      initialPin?.latitude,
      initialPin?.longitude,
      userLocation?.latitude,
      userLocation?.longitude,
    ],
  )

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              type?: string
              latitude?: number
              longitude?: number
            }
            if (
              payload.type === 'pick' &&
              typeof payload.latitude === 'number' &&
              typeof payload.longitude === 'number'
            ) {
              onPick({ latitude: payload.latitude, longitude: payload.longitude })
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0e0e14',
  },
})
