import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RunWalkActivityFinishDrawer } from '../components/runWalk/liveActivity/RunWalkActivityFinishDrawer'
import { RunWalkActivityLockOverlay } from '../components/runWalk/liveActivity/RunWalkActivityLockOverlay'
import { RunWalkActivityMetricsCard } from '../components/runWalk/liveActivity/RunWalkActivityMetricsCard'
import { RunWalkActivitySosButton } from '../components/runWalk/liveActivity/RunWalkActivitySosButton'
import { RunWalkActivitySosDrawer } from '../components/runWalk/liveActivity/RunWalkActivitySosDrawer'
import { RunWalkActivityStatusBar } from '../components/runWalk/liveActivity/RunWalkActivityStatusBar'
import { RunWalkActivityTrailMap } from '../components/runWalk/liveActivity/RunWalkActivityTrailMap'
import { useAuth } from '../contexts/AuthContext'
import { ACTIVITY_MODALITY_LABELS, MODALITY_DEFAULTS } from '../data/runWalkModalityConfig'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useRunWalkActivitySession } from '../hooks/useRunWalkActivitySession'
import { useRunWalkLiveSharePublisher } from '../hooks/useRunWalkLiveSharePublisher'
import { colors } from '../theme/colors'
import { getRunWalkRouteParams } from '../types/auth'

export function RunWalkLiveActivityScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, user } = useAuth()
  const params = getRunWalkRouteParams(routeParams)

  const modality = params.modality ?? 'walk'
  const modalityLabel = ACTIVITY_MODALITY_LABELS[modality]
  const durationMinutes = params.durationMinutes ?? MODALITY_DEFAULTS[modality].durationMinutes

  const [isLocked, setIsLocked] = useState(false)
  const [sosDrawerVisible, setSosDrawerVisible] = useState(false)
  const [finishDrawerVisible, setFinishDrawerVisible] = useState(false)

  const { location } = useRunWalkLiveSharePublisher({
    enabled: true,
    address: user?.address,
    participantName: user?.name ?? 'Participante',
    activityName: params.activityName ?? modalityLabel,
  })

  const session = useRunWalkActivitySession({
    modality,
    durationMinutes,
    coordinates: location.coordinates,
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
      return true
    }, [finishDrawerVisible, isLocked, sosDrawerVisible]),
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

  function handleConfirmFinish() {
    session.finishActivity()
  }

  return (
    <View style={styles.root}>
      <RunWalkActivityTrailMap trail={session.trail} fullscreen />

      <View
        pointerEvents="box-none"
        style={[styles.topOverlay, { paddingTop: Math.max(insets.top, 10) + 6 }]}
      >
        <RunWalkActivityStatusBar
          gpsQuality={location.gpsQuality}
          isLocating={location.isLocating}
          onLockPress={() => setIsLocked(true)}
        />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.sosOverlay, { top: Math.max(insets.top, 10) + 72 }]}
      >
        <RunWalkActivitySosButton onPress={() => setSosDrawerVisible(true)} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 14) + 8 }]}
      >
        <RunWalkActivityMetricsCard
          elapsedSeconds={session.elapsedSeconds}
          distanceKm={session.distanceKm}
          speedKmh={session.currentSpeedKmh}
          isFinished={session.isFinished}
          onFinishPress={handleFinishPress}
        />
      </View>

      <RunWalkActivityLockOverlay visible={isLocked} onUnlock={() => setIsLocked(false)} />

      <RunWalkActivitySosDrawer
        visible={sosDrawerVisible}
        onClose={() => setSosDrawerVisible(false)}
      />

      <RunWalkActivityFinishDrawer
        visible={finishDrawerVisible}
        elapsedSeconds={session.elapsedSeconds}
        distanceKm={session.distanceKm}
        speedKmh={session.currentSpeedKmh}
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
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  sosOverlay: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 10,
  },
})
