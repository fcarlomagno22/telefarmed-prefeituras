import {
  activateAppKeepAwakeAsync,
  deactivateAppKeepAwake,
} from '../adapters/appKeepAwake'
import { loadRunWalkActiveActivity } from '../data/runWalkActiveActivityStorage'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RunWalkLiveGpsFeed } from '../hooks/runWalkLiveGpsFeed'
import { saveRunWalkActivitySummary } from '../data/runWalkActivitySummaryStorage'
import { ACTIVITY_MODALITY_LABELS, MODALITY_DEFAULTS } from '../data/runWalkModalityConfig'
import {
  calculateAveragePaceMinPerKm,
  calculateAverageSpeedKmh,
  estimateCaloriesBurned,
  speedKmhToPaceMinPerKm,
} from '../utils/runWalkActivityStats'
import { resolveActivityPlace } from '../utils/runWalkActivityLocation'
import { prefetchRunWalkMapTiles } from '../utils/runWalkMapTilePrefetch'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RunWalkActivityFinishDrawer } from '../components/runWalk/liveActivity/RunWalkActivityFinishDrawer'
import { RunWalkActivityGpsNotice } from '../components/runWalk/liveActivity/RunWalkActivityGpsNotice'
import { RunWalkActivityLockButton } from '../components/runWalk/liveActivity/RunWalkActivityLockButton'
import { RunWalkActivityLockOverlay } from '../components/runWalk/liveActivity/RunWalkActivityLockOverlay'
import { RunWalkActivityMetricsCard } from '../components/runWalk/liveActivity/RunWalkActivityMetricsCard'
import { RunWalkActivityMusicButton } from '../components/runWalk/liveActivity/RunWalkActivityMusicButton'
import { RunWalkActivityPauseButton } from '../components/runWalk/liveActivity/RunWalkActivityPauseButton'
import { RunWalkActivityRecenterButton } from '../components/runWalk/liveActivity/RunWalkActivityRecenterButton'
import { RunWalkActivityShareLocationButton } from '../components/runWalk/liveActivity/RunWalkActivityShareLocationButton'
import { RunWalkActivitySosButton } from '../components/runWalk/liveActivity/RunWalkActivitySosButton'
import { RunWalkActivitySosDrawer } from '../components/runWalk/liveActivity/RunWalkActivitySosDrawer'
import { RunWalkActivityStatusBadge } from '../components/runWalk/liveActivity/RunWalkActivityStatusBadge'
import { RunWalkActivityTrailMap } from '../components/runWalk/liveActivity/RunWalkActivityTrailMap'
import { RunWalkShareLocationDrawer } from '../components/runWalk/preparation/RunWalkShareLocationDrawer'
import { RunWalkMusicAppsDrawer } from '../components/runWalk/preparation/RunWalkMusicAppsDrawer'
import { useAuth } from '../contexts/AuthContext'
import { consumeRunWalkPreLiveGpsCalibrated } from '../data/runWalkPreLiveGpsCalibration'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useGpsCalibration } from '../hooks/useGpsCalibration'
import { useRunWalkActivitySession } from '../hooks/useRunWalkActivitySession'
import type { RunWalkActivitySessionRestore } from '../hooks/useRunWalkActivitySession'
import { useRunWalkActiveActivityPersistence } from '../hooks/useRunWalkActiveActivityPersistence'
import { useRunWalkLiveSharePublisher } from '../hooks/useRunWalkLiveSharePublisher'
import { useStableHeadingRotation } from '../hooks/useStableHeadingRotation'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'

const METRICS_CARD_ESTIMATED_HEIGHT = 152
const SIDE_ACTIONS_GAP_ABOVE_METRICS = 10

export function RunWalkLiveActivityScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, user, navigateTo } = useAuth()
  const params = getRunWalkRouteParams(routeParams)

  const modality = params.modality ?? 'walk'
  const modalityLabel = ACTIVITY_MODALITY_LABELS[modality]
  const durationMinutes = params.durationMinutes ?? MODALITY_DEFAULTS[modality].durationMinutes
  const gpsPreCalibratedRef = useRef<boolean | null>(null)
  if (gpsPreCalibratedRef.current === null) {
    gpsPreCalibratedRef.current =
      params.gpsPreCalibrated === true || consumeRunWalkPreLiveGpsCalibrated()
  }
  const gpsPreCalibrated = gpsPreCalibratedRef.current

  const [isLocked, setIsLocked] = useState(false)
  const [sosDrawerVisible, setSosDrawerVisible] = useState(false)
  const [shareLocationDrawerVisible, setShareLocationDrawerVisible] = useState(false)
  const [musicDrawerVisible, setMusicDrawerVisible] = useState(false)
  const [finishDrawerVisible, setFinishDrawerVisible] = useState(false)
  const [followUserOnMap, setFollowUserOnMap] = useState(true)
  const [calibrationPaused, setCalibrationPaused] = useState(false)
  const [gpsRecordingEnabled] = useState(true)
  const [restoredSession, setRestoredSession] = useState<RunWalkActivitySessionRestore | null>(
    null,
  )
  const [restoreReady, setRestoreReady] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRestoredSession() {
      const record = await loadRunWalkActiveActivity(user?.cpf)
      if (!active) return
      setRestoredSession(record?.session ?? null)
      setRestoreReady(true)
    }

    void loadRestoredSession()

    return () => {
      active = false
    }
  }, [user?.cpf])

  const {
    location,
    activateSharing,
    endActiveLiveShareSession,
    isOffline,
    isSyncing,
    pendingSyncCount,
  } = useRunWalkLiveSharePublisher({
    enabled: true,
    address: user?.address,
    participantName: user?.name ?? 'Participante',
    activityName: params.activityName ?? modalityLabel,
  })

  const gpsFeed = useMemo<RunWalkLiveGpsFeed>(
    () => ({
      subscribePosition: location.subscribePosition,
      getGpsFix: location.getGpsFix,
    }),
    [location.getGpsFix, location.subscribePosition],
  )

  const gpsCalibration = useGpsCalibration({
    accuracyMeters: location.accuracyMeters,
    coordinates: location.coordinates,
    enabled: true,
    isPaused: calibrationPaused,
    initialPhase: gpsPreCalibrated ? 'recording' : 'awaiting',
  })

  const session = useRunWalkActivitySession({
    modality,
    durationMinutes,
    gpsFeed,
    enabled: restoreReady,
    gpsRecordingEnabled,
    patientCpf: user?.cpf,
    restoredSession,
  })

  const { clearActiveActivity } = useRunWalkActiveActivityPersistence({
    patientCpf: user?.cpf,
    modality,
    activityName: params.activityName ?? modalityLabel,
    intensity: params.intensity,
    durationMinutes,
    gpsPreCalibrated,
    enabled: restoreReady && !session.isFinished,
    isFinished: session.isFinished,
    getPersistSnapshot: session.getPersistSnapshot,
  })

  useEffect(() => {
    setCalibrationPaused(session.isPaused)
  }, [session.isPaused])

  const rotateWithHeading = useStableHeadingRotation(
    session.displaySpeedKmh,
    gpsCalibration.isRecording,
  )

  useEffect(() => {
    if (!location.coordinates || isOffline) return
    prefetchRunWalkMapTiles(location.coordinates.latitude, location.coordinates.longitude)
  }, [isOffline, location.coordinates])

  useAndroidBackHandler(
    useCallback(() => {
      if (isLocked) return true
      if (finishDrawerVisible) {
        setFinishDrawerVisible(false)
        return true
      }
      if (sosDrawerVisible) {
        setSosDrawerVisible(false)
        return true
      }
      if (shareLocationDrawerVisible) {
        setShareLocationDrawerVisible(false)
        return true
      }
      if (musicDrawerVisible) {
        setMusicDrawerVisible(false)
        return true
      }
      return true
    }, [finishDrawerVisible, isLocked, musicDrawerVisible, shareLocationDrawerVisible, sosDrawerVisible]),
  )

  useEffect(() => {
    void activateAppKeepAwakeAsync('run-walk-live-activity')
    return () => {
      void deactivateAppKeepAwake('run-walk-live-activity')
    }
  }, [])

  function handleFinishPress() {
    if (session.isFinished) return
    setFinishDrawerVisible(true)
  }

  async function handleConfirmFinish() {
    const elapsedSeconds = session.elapsedSeconds
    const distanceKm = session.distanceKm
    const averageSpeedKmh = session.averageSpeedKmh
    const trail = [...session.trail]
    const stepCount = session.stepCount
    const heartRateBpm = session.heartRateBpm

    session.finishActivity()
    await endActiveLiveShareSession()
    await clearActiveActivity()

    const summaryId = `run-walk-${Date.now()}`
    const activeMinutes = Math.max(1, Math.round(elapsedSeconds / 60))
    const trailStart = trail[0]
    let locationCity = location.cityLabel ?? user?.address?.city ?? null
    let locationState = user?.address?.state ?? null

    if (trailStart) {
      const place = await resolveActivityPlace(trailStart.latitude, trailStart.longitude)
      locationCity = place.city ?? locationCity
      locationState = place.state ?? locationState
    } else if (location.coordinates) {
      const place = await resolveActivityPlace(
        location.coordinates.latitude,
        location.coordinates.longitude,
      )
      locationCity = place.city ?? locationCity
      locationState = place.state ?? locationState
    }

    await saveRunWalkActivitySummary({
      id: summaryId,
      patientCpf: user?.cpf ?? 'guest',
      modality,
      activityName: params.activityName ?? modalityLabel,
      elapsedSeconds,
      distanceKm,
      averageSpeedKmh:
        averageSpeedKmh > 0 ? averageSpeedKmh : calculateAverageSpeedKmh(distanceKm, elapsedSeconds),
      paceMinPerKm:
        averageSpeedKmh > 0
          ? speedKmhToPaceMinPerKm(averageSpeedKmh)
          : calculateAveragePaceMinPerKm(distanceKm, elapsedSeconds),
      stepCount,
      heartRateBpm,
      estimatedCalories: estimateCaloriesBurned(modality, elapsedSeconds),
      activeMinutes,
      completedAt: new Date().toISOString(),
      trail,
      locationCity,
      locationState,
    })

    navigateTo('run-walk-checkin', { summaryId })
  }

  const bottomInset = Math.max(insets.bottom, 14) + 8
  const sideActionsBottom =
    bottomInset + METRICS_CARD_ESTIMATED_HEIGHT + SIDE_ACTIONS_GAP_ABOVE_METRICS

  if (!restoreReady) {
    return <View style={styles.root} />
  }

  return (
    <View style={styles.root}>
      {location.coordinates ? (
        <RunWalkActivityTrailMap
          trail={session.trail}
          liveGpsFeed={gpsFeed}
          mapTrailFeed={session.mapTrailFeed}
          fullscreen
          interactive
          liveTracking
          followUser={followUserOnMap}
          onUserPanned={() => setFollowUserOnMap(false)}
          profilePhotoUri={user?.selfieUri}
          rotateWithHeading={rotateWithHeading}
          isPaused={session.isPaused}
        />
      ) : (
        <View style={styles.mapPlaceholder} />
      )}

      {!followUserOnMap ? (
        <View
          pointerEvents="box-none"
          style={[styles.recenterOverlay, { top: Math.max(insets.top, 10) + 56 }]}
        >
          <RunWalkActivityRecenterButton onPress={() => setFollowUserOnMap(true)} />
        </View>
      ) : null}

      <View
        pointerEvents="none"
        style={[styles.topLeftOverlay, { top: Math.max(insets.top, 10) + 8 }]}
      >
        <RunWalkActivityStatusBadge
          gpsPhase={gpsCalibration.phase}
          gpsQuality={location.gpsQuality}
          gpsPreCalibrated={gpsPreCalibrated}
          isLocating={location.isLocating}
          isOffline={isOffline}
          isSyncing={isSyncing}
          pendingSyncCount={pendingSyncCount}
          hasLiveProgress={session.trail.length > 1 || session.distanceKm > 0}
        />
        <RunWalkActivityGpsNotice
          gpsPhase={gpsCalibration.phase}
          gpsQuality={location.gpsQuality}
          gpsPreCalibrated={gpsPreCalibrated}
          isLocating={location.isLocating}
          isOffline={isOffline}
          hasLiveProgress={session.trail.length > 1 || session.distanceKm > 0}
        />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.sideActionsOverlay, { bottom: sideActionsBottom }]}
      >
        <RunWalkActivityLockButton onPress={() => setIsLocked(true)} />
        <RunWalkActivityShareLocationButton
          onPress={() => setShareLocationDrawerVisible(true)}
        />
        <RunWalkActivityMusicButton onPress={() => setMusicDrawerVisible(true)} />
        {!session.isFinished ? (
          <View style={styles.emergencyRow}>
            <RunWalkActivitySosButton onPress={() => setSosDrawerVisible(true)} />
            <RunWalkActivityPauseButton
              isPaused={session.isPaused}
              onPress={session.togglePauseActivity}
            />
          </View>
        ) : (
          <RunWalkActivitySosButton onPress={() => setSosDrawerVisible(true)} />
        )}
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.bottomOverlay, { paddingBottom: bottomInset }]}
      >
        <RunWalkActivityMetricsCard
          elapsedSeconds={session.elapsedSeconds}
          distanceKm={session.distanceKm}
          speedKmh={session.displaySpeedKmh}
          speedLabel="Velocidade"
          isFinished={session.isFinished}
          isPaused={session.isPaused}
          onFinishPress={handleFinishPress}
        />
      </View>

      <RunWalkActivityLockOverlay visible={isLocked} onUnlock={() => setIsLocked(false)} />

      <RunWalkActivitySosDrawer
        visible={sosDrawerVisible}
        patientCpf={user?.cpf ?? 'guest'}
        onClose={() => setSosDrawerVisible(false)}
      />

      <RunWalkShareLocationDrawer
        visible={shareLocationDrawerVisible}
        participantName={user?.name ?? 'Participante'}
        activityName={modalityLabel}
        latitude={location.coordinates?.latitude ?? null}
        longitude={location.coordinates?.longitude ?? null}
        onClose={() => setShareLocationDrawerVisible(false)}
        showStartActions
        onSessionActivated={() => {
          void activateSharing()
        }}
        onContinueWithoutShare={() => setShareLocationDrawerVisible(false)}
      />

      <RunWalkMusicAppsDrawer
        visible={musicDrawerVisible}
        onClose={() => setMusicDrawerVisible(false)}
        onAppOpened={() => setMusicDrawerVisible(false)}
      />

      <RunWalkActivityFinishDrawer
        visible={finishDrawerVisible}
        elapsedSeconds={session.elapsedSeconds}
        distanceKm={session.distanceKm}
        speedKmh={session.averageSpeedKmh}
        onClose={() => setFinishDrawerVisible(false)}
        onConfirm={handleConfirmFinish}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  topLeftOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    gap: 8,
    alignItems: 'flex-start',
  },
  recenterOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  sideActionsOverlay: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    alignItems: 'flex-end',
    gap: 10,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 10,
  },
})
