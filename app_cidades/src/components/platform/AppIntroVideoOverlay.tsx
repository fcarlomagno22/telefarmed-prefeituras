import { useEventListener } from 'expo'
import {
  activateAppKeepAwakeAsync,
  deactivateAppKeepAwake,
} from '../../adapters/appKeepAwake'
import { StatusBar } from 'expo-status-bar'
import { VideoView, useVideoPlayer, type VideoPlayer } from 'expo-video'
import { useCallback, useEffect, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { getRegistrationVideoViewProps, safeInvokeVideoPlay } from '../../adapters/appVideo'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'

const VIDEO_SOURCE = require('../../../assets/logo_intro.mp4')
const KEEP_AWAKE_TAG = 'app-intro-video'
const WEB_PLAYBACK_CONFIRM_MS = 900

type AppIntroVideoOverlayProps = {
  onComplete: () => void
}

function configureIntroVideoPlayer(player: VideoPlayer): void {
  player.loop = false
  player.timeUpdateEventInterval = 0.2
  // Web só permite autoplay sem gesto do usuário quando o vídeo está mudo.
  player.muted = Platform.OS === 'web'
}

async function waitForPlayback(player: VideoPlayer, timeoutMs: number): Promise<boolean> {
  if (player.playing) return true

  return new Promise((resolve) => {
    const subscription = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        subscription.remove()
        resolve(true)
      }
    })

    setTimeout(() => {
      subscription.remove()
      resolve(player.playing)
    }, timeoutMs)
  })
}

async function attemptIntroPlayback(player: VideoPlayer): Promise<boolean> {
  player.muted = Platform.OS === 'web'

  const started = await safeInvokeVideoPlay(player)
  if (started) {
    return true
  }

  if (Platform.OS === 'web') {
    return waitForPlayback(player, WEB_PLAYBACK_CONFIRM_MS)
  }

  return false
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

    if (player.status === 'loading' || player.status === 'error') {
      return
    }

    playbackStartedRef.current = true

    void (async () => {
      const started = await attemptIntroPlayback(player)
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
        style={Platform.OS === 'web' ? styles.videoWeb : styles.video}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999999,
    elevation: 999999,
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
  interactionBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'default',
        userSelect: 'none',
      },
    }),
  },
})
