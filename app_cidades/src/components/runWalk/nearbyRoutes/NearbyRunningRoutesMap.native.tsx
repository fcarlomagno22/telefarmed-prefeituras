import { useEffect, useMemo, useRef, useState } from 'react'
import { colors } from '../../../theme/colors'
import { StyleSheet, View } from 'react-native'
import { AppWebView, type AppWebViewRef, type WebViewMessageEvent } from '../../../adapters/AppWebView'
import { resizeImageByLongEdge } from '../../../adapters/imageManipulation'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import {
  buildNearbyRunningRoutesMapMarkers,
  buildNearbyRunningRoutesUserPinHtml,
  getNearbyRunningRoutesMapView,
  getNearbyRunningRoutesUserPinMetrics,
  RUNNING_ROUTES_LEAFLET_CSS_URL,
  RUNNING_ROUTES_LEAFLET_JS_URL,
  RUNNING_ROUTES_MAP_CUSTOM_CSS,
  RUNNING_ROUTES_MDI_CSS_URL,
  RUNNING_ROUTES_TILE_URL,
  type NearbyRunningRoutesMapProps,
} from './nearbyRunningRoutesMapShared'

function buildNearbyRunningRoutesMapHtml({
  origin,
  spots,
  selectedId,
  profilePhotoDataUri,
}: NearbyRunningRoutesMapProps & { profilePhotoDataUri: string | null }) {
  const markers = JSON.stringify(buildNearbyRunningRoutesMapMarkers(spots, selectedId))
  const { flyLat, flyLng, flyZoom, hasSelection } = getNearbyRunningRoutesMapView(
    origin,
    spots,
    selectedId,
  )
  const originLabel = origin.label.replace(/'/g, "\\'")
  const userPinHtml = buildNearbyRunningRoutesUserPinHtml(profilePhotoDataUri)
  const { size: userPinSize, anchor: userPinAnchor } =
    getNearbyRunningRoutesUserPinMetrics(profilePhotoDataUri)

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, height=device-height, viewport-fit=cover" />
    <link rel="stylesheet" href="${RUNNING_ROUTES_LEAFLET_CSS_URL}" crossorigin="" />
    <link rel="stylesheet" href="${RUNNING_ROUTES_MDI_CSS_URL}" />
    <style>${RUNNING_ROUTES_MAP_CUSTOM_CSS}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="${RUNNING_ROUTES_LEAFLET_JS_URL}" crossorigin=""></script>
    <script>
      function postSelect(id) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id }));
        }
      }

      const map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView([${flyLat}, ${flyLng}], ${flyZoom});

      L.tileLayer('${RUNNING_ROUTES_TILE_URL}', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const userIcon = L.divIcon({
        className: 'user-pin-wrap',
        html: ${JSON.stringify(userPinHtml)},
        iconSize: [${userPinSize}, ${userPinSize}],
        iconAnchor: [${userPinAnchor}, ${userPinAnchor}],
      });

      const userMarker = L.marker([${origin.latitude}, ${origin.longitude}], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('${originLabel}', { direction: 'top', offset: [0, -10] });

      const markers = ${markers};
      const layers = [userMarker];

      markers.forEach((markerData) => {
        const icon = L.divIcon({
          className: 'spot-pin-wrap',
          html: '<div class="spot-pin ' + (markerData.selected ? 'selected' : '') + '"><i class="mdi mdi-run-fast"></i></div>',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([markerData.lat, markerData.lng], { icon, zIndexOffset: markerData.selected ? 900 : 500 })
          .addTo(map);
        marker.bindTooltip(markerData.name, { direction: 'top', offset: [0, -16] });
        marker.on('click', () => postSelect(markerData.id));
        layers.push(marker);
      });

      if (!${hasSelection ? 'true' : 'false'} && layers.length > 1) {
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
  profilePhotoUri,
  onSelectSpot,
}: NearbyRunningRoutesMapProps) {
  const webRef = useRef<AppWebViewRef>(null)
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = profilePhotoUri?.trim()
    if (!trimmed) {
      setProfilePhotoDataUri(null)
      return
    }

    let active = true

    async function loadPhoto() {
      if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (active) setProfilePhotoDataUri(trimmed)
        return
      }

      const resized = await resizeImageByLongEdge({ uri: trimmed }, { maxLongEdge: 72, compress: 0.82 })
      const dataUri = await profilePhotoToDataUri(resized.uri)
      if (active) {
        setProfilePhotoDataUri(dataUri)
      }
    }

    void loadPhoto()
    return () => {
      active = false
    }
  }, [profilePhotoUri])

  const html = useMemo(
    () =>
      buildNearbyRunningRoutesMapHtml({
        origin,
        spots,
        selectedId,
        profilePhotoDataUri,
        profilePhotoUri,
        onSelectSpot,
      }),
    [origin.latitude, origin.longitude, origin.label, profilePhotoDataUri, spots, selectedId, profilePhotoUri, onSelectSpot],
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
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
})
