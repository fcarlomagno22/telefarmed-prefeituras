import { drawerChrome } from '../../../theme/drawerChrome'
import { useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppWebView, type AppWebViewRef } from '../../../adapters/AppWebView'
import {
  parsePickerMapMessage,
  SPOT_PICKER_LEAFLET_CSS_URL,
  SPOT_PICKER_LEAFLET_JS_URL,
  SPOT_PICKER_MAP_CUSTOM_CSS,
  SPOT_PICKER_PICK_MARKER_HTML,
  SPOT_PICKER_TILE_URL,
  SPOT_PICKER_USER_PIN_HTML,
  type RunningRouteSpotPickerMapProps,
} from './runningRouteSpotPickerMapShared'

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
  <link rel="stylesheet" href="${SPOT_PICKER_LEAFLET_CSS_URL}" />
  <script src="${SPOT_PICKER_LEAFLET_JS_URL}"></script>
  <style>${SPOT_PICKER_MAP_CUSTOM_CSS}</style>
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

    L.tileLayer('${SPOT_PICKER_TILE_URL}', {
      maxZoom: 19,
    }).addTo(map);

    const pickIcon = L.divIcon({
      className: '',
      html: ${JSON.stringify(SPOT_PICKER_PICK_MARKER_HTML)},
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const userIcon = L.divIcon({
      className: '',
      html: ${JSON.stringify(SPOT_PICKER_USER_PIN_HTML)},
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
  fullBleed = false,
}: RunningRouteSpotPickerMapProps) {
  const webViewRef = useRef<AppWebViewRef>(null)

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
    <View style={[styles.container, fullBleed && styles.containerFullBleed]}>
      <AppWebView
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
          const coords = parsePickerMapMessage(event.nativeEvent.data)
          if (coords) onPick(coords)
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
  containerFullBleed: {
    ...StyleSheet.absoluteFillObject,
    minHeight: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: drawerChrome.surfaceBottom,
  },
})
