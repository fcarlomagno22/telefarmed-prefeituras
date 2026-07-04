/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GeoCoordinates } from '../../utils/geo'
import {
  buildScheduleUbtMapMarkers,
  SCHEDULE_UBT_LABELS_TILE_URL,
  SCHEDULE_UBT_SATELLITE_TILE_URL,
  SCHEDULE_UBT_STREET_TILE_URL,
  type ScheduleUbtMapLayerMode,
  type ScheduleUbtMapMarker,
} from './scheduleUbtMapShared'
import type { ScheduleUbtWithDistance } from '../../types/scheduleUbt'

export type ScheduleUbtMapController = {
  setMapLayer: (mode: ScheduleUbtMapLayerMode) => void
  getMapLayer: () => ScheduleUbtMapLayerMode
  updateMarkers: (home: GeoCoordinates, ubts: ScheduleUbtWithDistance[], selectedId: string) => void
  invalidateSize: () => void
  destroy: () => void
}

type CreateScheduleUbtMapOptions = {
  L: any
  map: any
  home: GeoCoordinates
  ubts: ScheduleUbtWithDistance[]
  selectedId: string
  onSelectUbt: (id: string) => void
}

export function createScheduleUbtLeafletMap(L: any, host: HTMLElement) {
  return L.map(host, {
    zoomControl: true,
    attributionControl: false,
  }).setView([0, 0], 12)
}

export function createScheduleUbtMapController(
  options: CreateScheduleUbtMapOptions,
): ScheduleUbtMapController {
  const { L, map, onSelectUbt } = options

  const streetLayer = L.tileLayer(SCHEDULE_UBT_STREET_TILE_URL, { maxZoom: 19 })
  const satelliteLayer = L.tileLayer(SCHEDULE_UBT_SATELLITE_TILE_URL, { maxZoom: 19 })
  const labelsLayer = L.tileLayer(SCHEDULE_UBT_LABELS_TILE_URL, {
    maxZoom: 19,
    opacity: 0.92,
  })

  let activeOverlay: any = null
  let activeMode: ScheduleUbtMapLayerMode = 'street'
  let markerLayers: any[] = []

  function clearBaseLayers() {
    if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer)
    if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer)
    if (activeOverlay && map.hasLayer(activeOverlay)) {
      map.removeLayer(activeOverlay)
      activeOverlay = null
    }
  }

  function setMapLayer(mode: ScheduleUbtMapLayerMode) {
    if (activeMode === mode) return
    activeMode = mode
    clearBaseLayers()

    if (mode === 'street') {
      streetLayer.addTo(map)
    } else if (mode === 'satellite') {
      satelliteLayer.addTo(map)
    } else {
      satelliteLayer.addTo(map)
      activeOverlay = labelsLayer
      activeOverlay.addTo(map)
    }
  }

  function clearMarkerLayers() {
    markerLayers.forEach((layer) => map.removeLayer(layer))
    markerLayers = []
  }

  function addHomeMarker(home: GeoCoordinates) {
    const homeMarker = L.circleMarker([home.latitude, home.longitude], {
      radius: 10,
      fillColor: '#4dabf7',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map)
    homeMarker.bindTooltip('Sua casa', { direction: 'top', offset: [0, -8] })
    markerLayers.push(homeMarker)
    return homeMarker
  }

  function addUbtMarkers(markers: ScheduleUbtMapMarker[]) {
    markers.forEach((markerData) => {
      const marker = L.circleMarker([markerData.lat, markerData.lng], {
        radius: markerData.selected ? 12 : 9,
        fillColor: markerData.selected ? '#ff8533' : '#ff6b00',
        color: markerData.selected ? '#ffffff' : '#ffd4a8',
        weight: markerData.selected ? 3 : 2,
        fillOpacity: 0.92,
      }).addTo(map)

      marker.bindTooltip(markerData.name, { direction: 'top', offset: [0, -8] })
      marker.on('click', () => onSelectUbt(markerData.id))
      markerLayers.push(marker)
    })
  }

  function fitMarkerBounds() {
    if (markerLayers.length > 1) {
      const group = L.featureGroup(markerLayers)
      map.fitBounds(group.getBounds().pad(0.18))
      return
    }

    map.setZoom(13)
  }

  function updateMarkers(home: GeoCoordinates, ubts: ScheduleUbtWithDistance[], selectedId: string) {
    clearMarkerLayers()
    addHomeMarker(home)
    addUbtMarkers(buildScheduleUbtMapMarkers(ubts, selectedId))
    fitMarkerBounds()
  }

  streetLayer.addTo(map)
  updateMarkers(options.home, options.ubts, options.selectedId)

  return {
    setMapLayer,
    getMapLayer: () => activeMode,
    updateMarkers,
    invalidateSize() {
      map.invalidateSize()
    },
    destroy() {
      clearMarkerLayers()
      clearBaseLayers()
    },
  }
}
