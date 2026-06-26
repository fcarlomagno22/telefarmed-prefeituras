import { useEventListener } from 'expo'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useEffect, useRef, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'

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

  useAndroidBackHandler(() => true)

  const player = useVideoPlayer(VIDEO_SOURCE, (instance) => {
    instance.loop = false
    instance.timeUpdateEventInterval = 0.2
    instance.muted = false
  })

  useEventListener(player, 'sourceLoad', () => {
    setProgress(0)
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
    player.currentTime = 0
    player.play()
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG)

    return () => {
      // useVideoPlayer já libera o player no unmount — não chamar pause() aqui.
      deactivateKeepAwake(KEEP_AWAKE_TAG)
    }
  }, [player])

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait']}
      onRequestClose={() => {
        // Bloqueia fechamento por botão voltar no Android.
      }}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit="cover"
        />

        <View style={styles.interactionBlocker} pointerEvents="auto" />

        <View style={[styles.progressWrap, { paddingBottom: Math.max(insets.bottom, 18) }]}>
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
    </Modal>
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
