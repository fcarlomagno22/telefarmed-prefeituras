import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useCallback, useEffect, useState } from 'react'
import { saveRunWalkActivitySummary } from '../data/runWalkActivitySummaryStorage'
import { ACTIVITY_MODALITY_LABELS, MODALITY_DEFAULTS } from '../data/runWalkModalityConfig'
import {
  calculateAveragePaceMinPerKm,
  calculateAverageSpeedKmh,
  estimateCaloriesBurned,
  speedKmhToPaceMinPerKm,
} from '../utils/runWalkActivityStats'
import { resolveActivityPlace } from '../utils/runWalkActivityLocation'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RunWalkActivityFinishDrawer } from '../components/runWalk/liveActivity/RunWalkActivityFinishDrawer'
import { RunWalkActivityLockButton } from '../components/runWalk/liveActivity/RunWalkActivityLockButton'
import { RunWalkActivityLockOverlay } from '../components/runWalk/liveActivity/RunWalkActivityLockOverlay'
import { RunWalkActivityMetricsCard } from '../components/runWalk/liveActivity/RunWalkActivityMetricsCard'
import { RunWalkActivityMusicButton } from '../components/runWalk/liveActivity/RunWalkActivityMusicButton'
import { RunWalkActivityOnlineBadge } from '../components/runWalk/liveActivity/RunWalkActivityOnlineBadge'
import { RunWalkActivityPauseButton } from '../components/runWalk/liveActivity/RunWalkActivityPauseButton'
import { RunWalkActivityRecenterButton } from '../components/runWalk/liveActivity/RunWalkActivityRecenterButton'
import { RunWalkActivityShareLocationButton } from '../components/runWalk/liveActivity/RunWalkActivityShareLocationButton'
import { RunWalkActivitySosButton } from '../components/runWalk/liveActivity/RunWalkActivitySosButton'
import { RunWalkActivitySosDrawer } from '../components/runWalk/liveActivity/RunWalkActivitySosDrawer'
import { RunWalkActivityTrailMap } from '../components/runWalk/liveActivity/RunWalkActivityTrailMap'
import { RunWalkShareLocationDrawer } from '../components/runWalk/preparation/RunWalkShareLocationDrawer'
import { RunWalkMusicAppsDrawer } from '../components/runWalk/preparation/RunWalkMusicAppsDrawer'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useRunWalkActivitySession } from '../hooks/useRunWalkActivitySession'
import { useRunWalkLiveSharePublisher } from '../hooks/useRunWalkLiveSharePublisher'
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

  const [isLocked, setIsLocked] = useState(false)
  const [sosDrawerVisible, setSosDrawerVisible] = useState(false)
  const [shareLocationDrawerVisible, setShareLocationDrawerVisible] = useState(false)
  const [musicDrawerVisible, setMusicDrawerVisible] = useState(false)
  const [finishDrawerVisible, setFinishDrawerVisible] = useState(false)
  const [followUserOnMap, setFollowUserOnMap] = useState(true)

  const { location, activateSharing, endActiveLiveShareSession } = useRunWalkLiveSharePublisher({
    enabled: true,
    address: user?.address,
    participantName: user?.name ?? 'Participante',
    activityName: params.activityName ?? modalityLabel,
  })

  const session = useRunWalkActivitySession({
    modality,
    durationMinutes,
    coordinates: location.coordinates,
    gpsSpeedMps: location.speedMps,
    accuracyMeters: location.accuracyMeters,
    enabled: true,
  })

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
    void activateKeepAwakeAsync('run-walk-live-activity')
    return () => {
      deactivateKeepAwake('run-walk-live-activity')
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

  return (
    <View style={styles.root}>
      <RunWalkActivityTrailMap
        trail={session.trail}
        currentPosition={location.coordinates}
        fullscreen
        interactive
        liveTracking
        followUser={followUserOnMap}
        onUserPanned={() => setFollowUserOnMap(false)}
        profilePhotoUri={user?.selfieUri}
        deviceHeadingDegrees={location.headingDegrees}
      />

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
        style={[styles.onlineBadgeOverlay, { top: Math.max(insets.top, 10) + 8 }]}
      >
        <RunWalkActivityOnlineBadge
          gpsQuality={location.gpsQuality}
          isLocating={location.isLocating}
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
          speedKmh={session.averageSpeedKmh}
          isFinished={session.isFinished}
          isPaused={session.isPaused}
          onFinishPress={handleFinishPress}
        />
      </View>

      <RunWalkActivityLockOverlay visible={isLocked} onUnlock={() => setIsLocked(false)} />

      <RunWalkActivitySosDrawer
        visible={sosDrawerVisible}
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
  onlineBadgeOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
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
