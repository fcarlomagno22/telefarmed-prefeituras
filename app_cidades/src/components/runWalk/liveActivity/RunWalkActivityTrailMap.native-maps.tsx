import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { Image, NativeSyntheticEvent, StyleSheet, View } from 'react-native'
import MapView, { Marker, Polyline, type Region } from 'react-native-maps'
import { colors } from '../../../theme/colors'
import type { GeoCoordinates } from '../../../utils/geo'
import { profilePhotoToDataUri } from '../../../utils/profilePhotoImage'
import {
  TRAIL_MAP_DEFAULT_CENTER,
  TRAIL_MAP_LIVE_LATITUDE_DELTA,
  TRAIL_MAP_LIVE_LONGITUDE_DELTA,
  TRAIL_MAP_LIVE_SEGMENT_OPACITY,
  TRAIL_MAP_POLYLINE_COLOR,
  type RunWalkActivityTrailMapProps,
} from './runWalkActivityTrailMapShared'
import { useRunWalkLiveMapFeedSync } from './useRunWalkLiveMapFeedSync'
import { useRunWalkNativeMapMotion } from './useRunWalkNativeMapMotion'

const LIVE_SEGMENT_COLOR = `rgba(34, 197, 94, ${TRAIL_MAP_LIVE_SEGMENT_OPACITY})`

function RunWalkTrailMapPin({
  hasPhoto,
  photoUri,
  size,
}: {
  hasPhoto: boolean
  photoUri: string | null
  size: number
}) {
  return (
    <View style={[styles.pinShell, { width: size, height: size }]}>
      {hasPhoto && photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={[
            styles.pinPhoto,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.pinDot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      )}
    </View>
  )
}

export const RunWalkActivityTrailMap = memo(function RunWalkActivityTrailMap({
  trail,
  currentPosition = null,
  liveGpsFeed = null,
  mapTrailFeed = null,
  height = 180,
  fullscreen = false,
  interactive = false,
  liveTracking = false,
  followUser = true,
  onUserPanned,
  onMapInteractionChange,
  profilePhotoUri,
  rotateWithHeading = false,
  isPaused = false,
}: RunWalkActivityTrailMapProps) {
  const usesLiveFeed = Boolean(liveTracking && liveGpsFeed && mapTrailFeed)
  const mapRef = useRef<ComponentRef<typeof MapView>>(null)
  const programmaticCameraRef = useRef(false)
  const mapGestureCountRef = useRef(0)
  const mapOriginRef = useRef(
    currentPosition ?? trail[trail.length - 1] ?? TRAIL_MAP_DEFAULT_CENTER,
  )
  const [isMapReady, setIsMapReady] = useState(false)
  const [profilePhotoDataUri, setProfilePhotoDataUri] = useState<string | null>(null)

  const { frame: liveFrame, setGpsTarget } = useRunWalkNativeMapMotion({
    enabled: liveTracking && isMapReady,
    isPaused,
    followUser,
    rotateWithHeading,
    mapRef,
    initialTrail: trail,
    initialPosition: currentPosition,
    programmaticCameraRef,
  })

  useEffect(() => {
    const trimmed = profilePhotoUri?.trim()
    if (!trimmed) {
      setProfilePhotoDataUri(null)
      return
    }

    let active = true
    void profilePhotoToDataUri(trimmed).then((dataUri) => {
      if (active) setProfilePhotoDataUri(dataUri)
    })

    return () => {
      active = false
    }
  }, [profilePhotoUri])

  const initialRegion = useMemo(
    () => ({
      latitude: mapOriginRef.current.latitude,
      longitude: mapOriginRef.current.longitude,
      latitudeDelta: TRAIL_MAP_LIVE_LATITUDE_DELTA,
      longitudeDelta: TRAIL_MAP_LIVE_LONGITUDE_DELTA,
    }),
    [],
  )

  const staticTrailCoordinates = useMemo(
    () => trail.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    [trail],
  )

  const staticMarkerCoordinate = staticTrailCoordinates[staticTrailCoordinates.length - 1] ?? null
  const pinSize = liveTracking ? (profilePhotoDataUri ? 36 : 22) : profilePhotoDataUri ? 44 : 30
  const hasPhoto = Boolean(profilePhotoDataUri)

  const handleFeedUpdate = useCallback(
    (payload: {
      trail: GeoCoordinates[]
      currentPosition: GeoCoordinates | null
      heading: number | null
      trailChanged: boolean
    }) => {
      if (isPaused) return
      setGpsTarget(payload)
    },
    [isPaused, setGpsTarget],
  )

  useRunWalkLiveMapFeedSync({
    enabled: usesLiveFeed && isMapReady && !isPaused,
    liveGpsFeed,
    mapTrailFeed,
    rotateWithHeading,
    followUser,
    onUpdate: handleFeedUpdate,
  })

  useEffect(() => {
    if (!liveTracking || usesLiveFeed || !isMapReady || isPaused) return

    setGpsTarget({
      trail,
      currentPosition,
      heading: null,
      trailChanged: true,
    })
  }, [currentPosition, isMapReady, isPaused, liveTracking, setGpsTarget, trail, usesLiveFeed])

  useEffect(() => {
    if (liveTracking || trail.length === 0 || !isMapReady) return

    mapRef.current?.fitToCoordinates(
      trail.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
      {
        edgePadding: { top: 28, right: 28, bottom: 28, left: 28 },
        animated: false,
      },
    )
  }, [isMapReady, liveTracking, trail])

  const notifyMapInteraction = useCallback(
    (active: boolean) => {
      onMapInteractionChange?.(active)
    },
    [onMapInteractionChange],
  )

  const handleGestureStart = useCallback(() => {
    if (programmaticCameraRef.current) return

    mapGestureCountRef.current += 1
    if (mapGestureCountRef.current === 1) {
      notifyMapInteraction(true)
    }

    if (liveTracking && followUser) {
      onUserPanned?.()
    }
  }, [followUser, liveTracking, notifyMapInteraction, onUserPanned])

  const handleGestureEnd = useCallback(() => {
    mapGestureCountRef.current = Math.max(0, mapGestureCountRef.current - 1)
    if (mapGestureCountRef.current === 0) {
      notifyMapInteraction(false)
    }
  }, [notifyMapInteraction])

  const handleRegionChangeStart = useCallback(
    (event: NativeSyntheticEvent<{ isGesture?: boolean }>) => {
      if (programmaticCameraRef.current) return
      if (event.nativeEvent.isGesture === false) return
      handleGestureStart()
    },
    [handleGestureStart],
  )

  const handleRegionChangeComplete = useCallback(
    (_region: Region, details: { isGesture?: boolean }) => {
      if (programmaticCameraRef.current) return
      if (details.isGesture === false) return
      handleGestureEnd()
    },
    [handleGestureEnd],
  )

  const handleMapReady = useCallback(() => {
    setIsMapReady(true)
  }, [])

  const mapGesturesEnabled = interactive || liveTracking
  const committedTrail = liveTracking ? liveFrame.committedTrail : trail
  const committedCoordinates = useMemo(
    () =>
      committedTrail.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    [committedTrail],
  )
  const markerCoordinate = liveTracking ? liveFrame.markerPosition : staticMarkerCoordinate
  const liveSegmentCoordinates = liveTracking
    ? liveFrame.liveSegment.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      }))
    : []

  return (
    <View style={[styles.wrap, fullscreen ? styles.wrapFullscreen : { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        rotateEnabled={rotateWithHeading && liveTracking}
        scrollEnabled={mapGesturesEnabled}
        zoomEnabled={mapGesturesEnabled}
        pitchEnabled={false}
        onMapReady={handleMapReady}
        onPanDrag={liveTracking ? handleGestureStart : undefined}
        onRegionChangeStart={mapGesturesEnabled ? handleRegionChangeStart : undefined}
        onRegionChangeComplete={mapGesturesEnabled ? handleRegionChangeComplete : undefined}
        moveOnMarkerPress={false}
        loadingEnabled
        loadingIndicatorColor={TRAIL_MAP_POLYLINE_COLOR}
      >
        {committedCoordinates.length > 1 ? (
          <Polyline
            coordinates={committedCoordinates}
            strokeColor={TRAIL_MAP_POLYLINE_COLOR}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {liveTracking && liveSegmentCoordinates.length > 1 ? (
          <Polyline
            coordinates={liveSegmentCoordinates}
            strokeColor={LIVE_SEGMENT_COLOR}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        ) : null}

        {markerCoordinate ? (
          <Marker
            coordinate={markerCoordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={10}
          >
            <RunWalkTrailMapPin hasPhoto={hasPhoto} photoUri={profilePhotoDataUri} size={pinSize} />
          </Marker>
        ) : null}
      </MapView>
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
    backgroundColor: colors.background,
  },
  wrapFullscreen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
  },
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pinShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    backgroundColor: TRAIL_MAP_POLYLINE_COLOR,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: TRAIL_MAP_POLYLINE_COLOR,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  pinPhoto: {
    borderWidth: 2,
    borderColor: TRAIL_MAP_POLYLINE_COLOR,
  },
})
