import { useEventListener } from 'expo'
import {
  activateAppKeepAwakeAsync,
  deactivateAppKeepAwake,
} from '../../adapters/appKeepAwake'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  configureRegistrationVideoPlayer,
  getAppVideoPlayFailureMessage,
  getRegistrationVideoViewProps,
  markAppVideoUserGesture,
  playAppVideoPlayer,
} from '../../adapters/appVideo'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import { AppModal } from '../AppModal'
import { PrimaryButton } from '../PrimaryButton'

const VIDEO_SOURCE = require('../../../assets/video_presentation.mp4')
const KEEP_AWAKE_TAG = 'registration-presentation-video'

type RegisterPresentationVideoOverlayProps = {
  onComplete: () => void
}

export function RegisterPresentationVideoOverlay({
  onComplete,
}: RegisterPresentationVideoOverlayProps) {
  const insets = useSafeAreaInsets()
  const completedRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [awaitingUserGesture, setAwaitingUserGesture] = useState(false)
  const [playFailureMessage, setPlayFailureMessage] = useState<string | null>(null)

  useAndroidBackHandler(() => true)

  const player = useVideoPlayer(VIDEO_SOURCE, configureRegistrationVideoPlayer)
  const videoViewProps = getRegistrationVideoViewProps()

  const attemptPlay = useCallback(async () => {
    player.currentTime = 0
    const result = await playAppVideoPlayer(player)

    if (!result.ok) {
      setAwaitingUserGesture(true)
      setPlayFailureMessage(getAppVideoPlayFailureMessage(result.reason))
      return
    }

    setAwaitingUserGesture(false)
    setPlayFailureMessage(null)
  }, [player])

  useEventListener(player, 'sourceLoad', () => {
    setProgress(0)
    setIsLoading(true)
  })

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'readyToPlay') {
      setIsLoading(false)
    }
  })

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) {
      setAwaitingUserGesture(false)
      setPlayFailureMessage(null)
      setIsLoading(false)
    }
  })

  useEventListener(player, 'timeUpdate', (payload) => {
    const duration = player.duration
    if (duration <= 0) return

    setProgress(Math.min(Math.max(payload.currentTime / duration, 0), 1))
  })

  useEventListener(player, 'playToEnd', () => {
    if (completedRef.current) return
    completedRef.current = true
    setTimeout(() => {
      onComplete()
    }, 0)
  })

  useEffect(() => {
    completedRef.current = false
    setProgress(0)
    setIsLoading(true)
    setAwaitingUserGesture(false)
    setPlayFailureMessage(null)
    void attemptPlay()
    void activateAppKeepAwakeAsync(KEEP_AWAKE_TAG)

    return () => {
      // useVideoPlayer já libera o player no unmount — não chamar pause() aqui.
      deactivateAppKeepAwake(KEEP_AWAKE_TAG)
    }
  }, [attemptPlay, player])

  const handleStartPlayback = () => {
    markAppVideoUserGesture()
    void attemptPlay()
  }

  return (
    <AppModal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      supportedOrientations={['portrait']}
      navBarUnderlayColor="#000000"
      onRequestClose={() => {
        // Bloqueia fechamento por botão voltar no Android.
      }}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <VideoView
          style={Platform.OS === 'web' ? styles.videoWeb : styles.video}
          player={player}
          {...videoViewProps}
          onFirstFrameRender={() => setIsLoading(false)}
        />

        {isLoading && !awaitingUserGesture ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {awaitingUserGesture ? (
          <View style={styles.gestureOverlay}>
            <Text style={styles.gestureTitle}>Apresentação do app</Text>
            {playFailureMessage ? (
              <Text style={styles.gestureMessage}>{playFailureMessage}</Text>
            ) : null}
            <PrimaryButton label="Iniciar apresentação" onPress={handleStartPlayback} />
          </View>
        ) : (
          <View style={styles.interactionBlocker} pointerEvents="auto" />
        )}

        <View
          style={[
            styles.progressWrap,
            { paddingBottom: getModalFooterPadding(insets.bottom, 6) },
          ]}
        >
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoWeb: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  gestureOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    gap: 16,
  },
  gestureTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  gestureMessage: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  interactionBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  progressWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 4,
  },
})
