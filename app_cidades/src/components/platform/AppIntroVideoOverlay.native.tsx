import { useEventListener } from 'expo'
import {
  activateAppKeepAwakeAsync,
  deactivateAppKeepAwake,
} from '../../adapters/appKeepAwake'
import { StatusBar } from 'expo-status-bar'
import { VideoView, useVideoPlayer, type VideoPlayer } from 'expo-video'
import { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { getRegistrationVideoViewProps, safeInvokeVideoPlay } from '../../adapters/appVideo'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'

const VIDEO_SOURCE = require('../../../assets/logo_intro.mp4')
const KEEP_AWAKE_TAG = 'app-intro-video'

type AppIntroVideoOverlayProps = {
  onComplete: () => void
}

function configureIntroVideoPlayer(player: VideoPlayer): void {
  player.loop = false
  player.timeUpdateEventInterval = 0.2
  player.muted = false
}

export function AppIntroVideoOverlay({ onComplete }: AppIntroVideoOverlayProps) {
  const completedRef = useRef(false)
  const playbackStartedRef = useRef(false)
  const mountedRef = useRef(true)
  const player = useVideoPlayer(VIDEO_SOURCE, configureIntroVideoPlayer)
  const videoViewProps = getRegistrationVideoViewProps()

  useAndroidBackHandler(() => true)

  const finishIntro = useCallback(() => {
    if (completedRef.current || !mountedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  const startPlaybackOnce = useCallback(() => {
    if (playbackStartedRef.current || completedRef.current || !mountedRef.current) {
      return
    }

    if (player.status === 'error') {
      finishIntro()
      return
    }

    if (player.status === 'loading') {
      return
    }

    playbackStartedRef.current = true

    void (async () => {
      const started = await safeInvokeVideoPlay(player)
      if (!mountedRef.current) return

      if (!started) {
        finishIntro()
      }
    })()
  }, [finishIntro, player])

  useEventListener(player, 'playToEnd', () => {
    finishIntro()
  })

  useEventListener(player, 'sourceLoad', () => {
    startPlaybackOnce()
  })

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') {
      finishIntro()
      return
    }

    if (status === 'readyToPlay') {
      startPlaybackOnce()
    }
  })

  useEffect(() => {
    mountedRef.current = true
    completedRef.current = false
    playbackStartedRef.current = false
    void activateAppKeepAwakeAsync(KEEP_AWAKE_TAG)

    startPlaybackOnce()

    return () => {
      mountedRef.current = false
      deactivateAppKeepAwake(KEEP_AWAKE_TAG)
    }
  }, [player, startPlaybackOnce])

  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <StatusBar hidden />
      <VideoView
        style={styles.video}
        player={player}
        {...videoViewProps}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
        playsInline
      />
      <View style={styles.interactionBlocker} pointerEvents="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
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
})
