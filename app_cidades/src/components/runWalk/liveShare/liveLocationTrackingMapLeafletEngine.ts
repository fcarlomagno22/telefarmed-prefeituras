/* eslint-disable @typescript-eslint/no-explicit-any */

import { NEARBY_UNITS_TILE_LAYER_OPTIONS, NEARBY_UNITS_TILE_URL } from '../../nearbyUnits/nearbyUnitsMapShared'

type LiveShareTrackingCallbacks = {
  onMapReady?: () => void
}

export type LiveShareTrackingMapController = {
  updateLiveShareMap: (
    trail: [number, number][],
    nextBottomInset?: number,
    nextTopInset?: number,
  ) => void
  recenterLiveShareMap: () => void
  setLiveShareFollowUser: (value: boolean) => void
  invalidateSize: () => void
  destroy: () => void
}

type CreateLiveShareTrackingMapOptions = {
  L: any
  map: any
  initialTrail: [number, number][]
  bottomInsetPx: number
  topInsetPx: number
  callbacks?: LiveShareTrackingCallbacks
}

export function createLiveShareTrackingMapController(
  options: CreateLiveShareTrackingMapOptions,
): LiveShareTrackingMapController {
  const { L, map, initialTrail, bottomInsetPx: initialBottomInset, topInsetPx: initialTopInset, callbacks } =
    options

  let polyline: any = null
  let marker: any = null
  let followUser = true
  let bottomInsetPx = initialBottomInset
  let topInsetPx = initialTopInset
  let trailPoints = initialTrail.slice()

  function focusParticipantInVisibleArea() {
    const offsetY = Math.max(0, Math.round((bottomInsetPx - topInsetPx) / 2))
    if (offsetY > 0) map.panBy([0, offsetY], { animate: false })
  }

  function resetTrail(trail: [number, number][]) {
    if (polyline) {
      map.removeLayer(polyline)
      polyline = null
    }

    if (trail.length > 1) {
      polyline = L.polyline(trail, {
        color: '#22c55e',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
    }
  }

  function ensureMarker(latlng: any) {
    const icon = L.divIcon({
      className: 'live-pin-wrap',
      html: '<div class="live-pin-shell"><div class="live-pin-pulse"></div><div class="live-pin-body"></div></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    if (!marker) {
      marker = L.marker(latlng, { icon, zIndexOffset: 1000 }).addTo(map)
      return
    }

    marker.setLatLng(latlng)
  }

  function centerOnParticipant(latlng: any) {
    if (!latlng) return
    map.setView(latlng, Math.max(map.getZoom(), 16), { animate: false })
    focusParticipantInVisibleArea()
  }

  function updateLiveShareMap(
    trail: [number, number][],
    nextBottomInset?: number,
    nextTopInset?: number,
  ) {
    if (typeof nextBottomInset === 'number') bottomInsetPx = nextBottomInset
    if (typeof nextTopInset === 'number') topInsetPx = nextTopInset

    trailPoints = trail.slice()
    resetTrail(trail)
    if (trail.length === 0) return

    const latest = trail[trail.length - 1]
    const latlng = L.latLng(latest[0], latest[1])
    ensureMarker(latlng)

    if (followUser) centerOnParticipant(latlng)
  }

  function recenterLiveShareMap() {
    followUser = true
    if (trailPoints.length === 0) return
    const latest = trailPoints[trailPoints.length - 1]
    centerOnParticipant(L.latLng(latest[0], latest[1]))
  }

  function setLiveShareFollowUser(value: boolean) {
    followUser = Boolean(value)
  }

  function handleDragStart() {
    followUser = false
  }

  map.on('dragstart', handleDragStart)

  updateLiveShareMap(trailPoints, bottomInsetPx, topInsetPx)

  map.whenReady(() => {
    map.invalidateSize()
    callbacks?.onMapReady?.()
  })

  return {
    updateLiveShareMap,
    recenterLiveShareMap,
    setLiveShareFollowUser,
    invalidateSize() {
      map.invalidateSize()
    },
    destroy() {
      map.off('dragstart', handleDragStart)
    },
  }
}

export function createLiveShareTrackingLeafletMap(L: any, host: HTMLElement) {
  return L.map(host, {
    zoomControl: false,
    attributionControl: false,
    dragging: true,
    touchZoom: true,
    doubleClickZoom: true,
    scrollWheelZoom: false,
    minZoom: 10,
    maxZoom: 19,
  })
}

export function addLiveShareTrackingTileLayer(L: any, map: any) {
  return L.tileLayer(NEARBY_UNITS_TILE_URL, {
    ...NEARBY_UNITS_TILE_LAYER_OPTIONS,
  }).addTo(map)
}
