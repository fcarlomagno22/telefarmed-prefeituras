/* eslint-disable @typescript-eslint/no-explicit-any */

type LiveTrailMapCallbacks = {
  onUserPanned?: () => void
}

export type LiveTrailMapController = {
  updateLiveTrailMap: (
    trailPoints: [number, number][],
    heading: number | null,
    currentLat: number | null,
    currentLng: number | null,
    shouldFollow?: boolean,
  ) => void
  setFollowUser: (value: boolean, lat?: number | null, lng?: number | null) => void
  recenterOnUser: (lat?: number | null, lng?: number | null) => void
  updatePinPhoto: (src: string | null) => void
  invalidateSize: () => void
  destroy: () => void
}

type CreateLiveTrailMapControllerOptions = {
  L: any
  map: any
  initialLatitude: number
  initialLongitude: number
  interactive: boolean
  pinSize: number
  pinAnchor: number
  liveZoom: number
  callbacks?: LiveTrailMapCallbacks
}

export function createLiveTrailMapController(
  options: CreateLiveTrailMapControllerOptions,
): LiveTrailMapController {
  const { L, map, initialLatitude, initialLongitude, pinSize, pinAnchor, liveZoom, callbacks } =
    options

  let polyline: any = null
  let liveSegment: any = null
  let marker: any = null
  let trailCoords: any[] = []
  let followUser = true
  let mapBearing = 0
  let programmaticMove = false
  let pinPhotoSrc: string | null = null
  let lastMapHeading: number | null = null
  let lastKnownLatLng = L.latLng(initialLatitude, initialLongitude)

  function toLatLng(point: unknown) {
    if (!point) return null
    if (typeof point === 'object' && point !== null && 'lat' in point && 'lng' in point) {
      const candidate = point as { lat: number; lng: number }
      return L.latLng(Number(candidate.lat), Number(candidate.lng))
    }
    if (Array.isArray(point) && point.length >= 2) {
      return L.latLng(Number(point[0]), Number(point[1]))
    }
    return null
  }

  function normalizeTrail(trailPoints: unknown[]) {
    return (trailPoints || []).map(toLatLng).filter(Boolean)
  }

  function buildPinHtml() {
    const hasPhoto = Boolean(pinPhotoSrc)
    const bodyClass = `live-pin-body ${hasPhoto ? 'is-photo' : 'is-dot'}`
    if (hasPhoto) {
      return `<div class="live-pin-shell"><div class="${bodyClass}"><img src="${pinPhotoSrc}" alt="" /></div></div>`
    }
    return `<div class="live-pin-shell"><div class="${bodyClass}"></div></div>`
  }

  function createMarkerIcon() {
    return L.divIcon({
      className: 'live-pin-wrap',
      html: buildPinHtml(),
      iconSize: [pinSize, pinSize],
      iconAnchor: [pinAnchor, pinAnchor],
    })
  }

  function applyMapRotation() {
    const pane = map.getPane('mapPane')
    if (!pane) return
    const size = map.getSize()
    if (!size?.x || !size?.y) return
    pane.style.transformOrigin = `${size.x / 2}px ${size.y / 2}px`
    pane.style.transform = mapBearing === 0 ? '' : `rotate(${mapBearing}deg)`
  }

  function setMapBearing(heading: number | null) {
    if (!followUser) return
    if (heading == null || !Number.isFinite(Number(heading))) return
    mapBearing = -Number(heading)
    applyMapRotation()
  }

  function clearMapRotation() {
    mapBearing = 0
    applyMapRotation()
  }

  function followMapTo(latlng: any, forceZoom?: number) {
    if (!followUser || !latlng) return
    const zoom = forceZoom != null ? forceZoom : map.getZoom()
    programmaticMove = true
    map.setView(latlng, zoom, { animate: false })
    programmaticMove = false
    applyMapRotation()
  }

  function ensureMarker(latlng: any) {
    if (!latlng) return
    if (!marker) {
      marker = L.marker(latlng, {
        icon: createMarkerIcon(),
        zIndexOffset: 1000,
      }).addTo(map)
    } else {
      marker.setLatLng(latlng)
    }
    lastKnownLatLng = latlng
  }

  function syncFollowMode(shouldFollow: boolean, latlng: any) {
    followUser = Boolean(shouldFollow)
    if (latlng) ensureMarker(latlng)
    if (followUser) {
      followMapTo(latlng)
      if (lastMapHeading != null) {
        setMapBearing(lastMapHeading)
      }
      return
    }
    clearMapRotation()
  }

  function handleUserMapInteraction() {
    if (programmaticMove || !followUser) return
    followUser = false
    clearMapRotation()
    callbacks?.onUserPanned?.()
  }

  function updateLiveSegment(targetLatLng: unknown) {
    const target = toLatLng(targetLatLng)
    if (trailCoords.length === 0 || !target) {
      if (liveSegment) {
        map.removeLayer(liveSegment)
        liveSegment = null
      }
      return
    }

    const lastCommitted = trailCoords[trailCoords.length - 1]
    if (
      Math.abs(lastCommitted.lat - target.lat) < 0.0000005 &&
      Math.abs(lastCommitted.lng - target.lng) < 0.0000005
    ) {
      if (liveSegment) {
        map.removeLayer(liveSegment)
        liveSegment = null
      }
      return
    }

    if (!liveSegment) {
      liveSegment = L.polyline([lastCommitted, target], {
        color: '#22c55e',
        weight: 4,
        opacity: 0.72,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
    } else {
      liveSegment.setLatLngs([lastCommitted, target])
    }
  }

  function resetTrailPolyline(trailPoints: unknown[]) {
    if (polyline) {
      map.removeLayer(polyline)
      polyline = null
    }
    if (liveSegment) {
      map.removeLayer(liveSegment)
      liveSegment = null
    }
    trailCoords = normalizeTrail(trailPoints)

    if (trailCoords.length > 1) {
      polyline = L.polyline(trailCoords, {
        color: '#22c55e',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
    }
  }

  function appendTrailPoints(trailPoints: unknown[]) {
    const normalized = normalizeTrail(trailPoints)
    if (normalized.length < trailCoords.length) {
      resetTrailPolyline(normalized)
      return
    }
    if (normalized.length === 0) {
      resetTrailPolyline([])
      return
    }

    const newPoints = normalized.slice(trailCoords.length)
    if (newPoints.length === 0) return

    if (!polyline) {
      polyline = L.polyline(newPoints, {
        color: '#22c55e',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
    } else {
      newPoints.forEach((point: any) => polyline.addLatLng(point))
    }

    trailCoords = normalized.slice()
    if (liveSegment) {
      map.removeLayer(liveSegment)
      liveSegment = null
    }
  }

  function updateLiveTrailMapInternal(
    trailPoints: [number, number][],
    heading: number | null,
    currentLat: number | null,
    currentLng: number | null,
    shouldFollow?: boolean,
  ) {
    appendTrailPoints(trailPoints)

    const hasCurrent =
      currentLat != null &&
      currentLng != null &&
      Number.isFinite(Number(currentLat)) &&
      Number.isFinite(Number(currentLng))

    const target = hasCurrent
      ? L.latLng(Number(currentLat), Number(currentLng))
      : trailCoords.length > 0
        ? trailCoords[trailCoords.length - 1]
        : null

    if (!target) return

    if (typeof shouldFollow === 'boolean') {
      syncFollowMode(shouldFollow, target)
    } else {
      ensureMarker(target)
      if (followUser) {
        followMapTo(target)
      }
    }

    if (followUser && heading != null && Number.isFinite(Number(heading))) {
      setMapBearing(Number(heading))
    }

    updateLiveSegment(target)
  }

  function setFollowUser(value: boolean, lat?: number | null, lng?: number | null) {
    if (!value) {
      followUser = false
      clearMapRotation()
      return
    }
    recenterOnUser(lat, lng)
  }

  function recenterOnUser(lat?: number | null, lng?: number | null) {
    let target: any = null
    if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      target = L.latLng(Number(lat), Number(lng))
    } else if (lastKnownLatLng) {
      target = lastKnownLatLng
    } else if (trailCoords.length > 0) {
      target = trailCoords[trailCoords.length - 1]
    } else if (marker) {
      target = marker.getLatLng()
    }

    if (!target) return

    followUser = true
    ensureMarker(target)
    clearMapRotation()
    programmaticMove = true
    map.setView(target, liveZoom, { animate: false })
    programmaticMove = false
    map.invalidateSize(true)

    window.requestAnimationFrame(() => {
      map.invalidateSize(true)
      if (lastMapHeading != null) {
        setMapBearing(lastMapHeading)
      }
    })
  }

  function updatePinPhoto(src: string | null) {
    pinPhotoSrc = src || null
    if (!marker) return
    marker.setIcon(createMarkerIcon())
  }

  ensureMarker(lastKnownLatLng)

  map.on('resize', () => {
    map.invalidateSize(true)
    if (followUser && lastKnownLatLng) {
      followMapTo(lastKnownLatLng)
    } else {
      applyMapRotation()
    }
  })

  map.on('dragstart', handleUserMapInteraction)
  map.on('zoomstart', handleUserMapInteraction)

  map.on('dblclick', (event: { latlng: any }) => {
    programmaticMove = true
    map.setView(event.latlng, Math.min(map.getZoom() + 1, map.getMaxZoom()))
    programmaticMove = false
  })

  return {
    updateLiveTrailMap(trailPoints, heading, currentLat, currentLng, shouldFollow) {
      if (heading != null && Number.isFinite(Number(heading))) {
        lastMapHeading = Number(heading)
      }
      updateLiveTrailMapInternal(trailPoints, heading, currentLat, currentLng, shouldFollow)
    },
    setFollowUser,
    recenterOnUser,
    updatePinPhoto,
    invalidateSize() {
      map.invalidateSize(true)
    },
    destroy() {
      map.off('resize')
      map.off('dragstart')
      map.off('zoomstart')
      map.off('dblclick')
    },
  }
}

export type StaticTrailMapController = {
  invalidateSize: () => void
  destroy: () => void
}

type SetupStaticTrailMapOptions = {
  L: any
  map: any
  trail: [number, number][]
  profilePhotoDataUri: string | null
  interactive: boolean
  onMapInteractionChange?: (active: boolean) => void
}

export function setupStaticTrailMap(options: SetupStaticTrailMapOptions): StaticTrailMapController {
  const { L, map, trail, profilePhotoDataUri, interactive, onMapInteractionChange } = options
  const hasTrail = trail.length > 0
  const centerLat = trail[trail.length - 1]?.[0] ?? -23.5505
  const centerLng = trail[trail.length - 1]?.[1] ?? -46.6333
  const hasPhoto = Boolean(profilePhotoDataUri)
  const pinSize = hasPhoto ? 44 : 30
  const pinAnchor = hasPhoto ? 22 : 15

  map.setView([centerLat, centerLng], hasTrail ? 16 : 14)

  const trailCoords = trail.map((point) => L.latLng(point[0], point[1]))
  if (trailCoords.length > 1) {
    L.polyline(trailCoords, {
      color: '#22c55e',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)
    map.fitBounds(L.latLngBounds(trailCoords), { padding: [28, 28], maxZoom: 17 })
  }

  if (trailCoords.length > 0) {
    const last = trailCoords[trailCoords.length - 1]
    const bodyClass = `live-pin-body ${hasPhoto ? 'is-photo' : 'is-dot'}`
    const html = hasPhoto
      ? `<div class="live-pin-shell"><div class="${bodyClass}"><img src="${profilePhotoDataUri}" alt="" /></div></div>`
      : `<div class="live-pin-shell"><div class="${bodyClass}"></div></div>`

    L.marker(last, {
      icon: L.divIcon({
        className: 'live-pin-wrap',
        html,
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinAnchor, pinAnchor],
      }),
      zIndexOffset: 1000,
    }).addTo(map)
  }

  let mapInteractionCount = 0

  function notifyMapInteraction(active: boolean) {
    onMapInteractionChange?.(active)
  }

  function beginMapInteraction() {
    mapInteractionCount += 1
    if (mapInteractionCount === 1) notifyMapInteraction(true)
  }

  function endMapInteraction() {
    mapInteractionCount = Math.max(0, mapInteractionCount - 1)
    if (mapInteractionCount === 0) notifyMapInteraction(false)
  }

  const disposers: Array<() => void> = []

  if (interactive) {
    map.on('dragstart', beginMapInteraction)
    map.on('zoomstart', beginMapInteraction)
    map.on('dragend', endMapInteraction)
    map.on('zoomend', endMapInteraction)
    disposers.push(() => {
      map.off('dragstart', beginMapInteraction)
      map.off('zoomstart', beginMapInteraction)
      map.off('dragend', endMapInteraction)
      map.off('zoomend', endMapInteraction)
    })

    const mapElement = map.getContainer?.() as HTMLElement | undefined
    if (mapElement) {
      mapElement.addEventListener('touchstart', beginMapInteraction, { passive: true })
      mapElement.addEventListener('touchend', endMapInteraction, { passive: true })
      mapElement.addEventListener('touchcancel', endMapInteraction, { passive: true })
      disposers.push(() => {
        mapElement.removeEventListener('touchstart', beginMapInteraction)
        mapElement.removeEventListener('touchend', endMapInteraction)
        mapElement.removeEventListener('touchcancel', endMapInteraction)
      })
    }
  }

  return {
    invalidateSize() {
      map.invalidateSize(true)
    },
    destroy() {
      disposers.forEach((dispose) => dispose())
    },
  }
}

export function createTrailLeafletMap(
  L: any,
  host: HTMLElement,
  options: { interactive: boolean; liveTracking: boolean },
) {
  const interactive = options.interactive || options.liveTracking

  return L.map(host, {
    zoomControl: false,
    attributionControl: false,
    touchZoom: interactive,
    dragging: interactive,
    doubleClickZoom: interactive,
    scrollWheelZoom: false,
    boxZoom: false,
    minZoom: 10,
    maxZoom: 19,
  })
}

export function addTrailMapTileLayer(L: any, map: any) {
  return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map)
}
