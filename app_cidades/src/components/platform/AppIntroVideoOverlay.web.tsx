import { StatusBar } from 'expo-status-bar'
import { createElement, useCallback, useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

const INTRO_VIDEO_SRC = '/logo_intro.mp4'
const INTRO_MAX_MS = 45_000

type AppIntroVideoOverlayProps = {
  onComplete: () => void
}

export function AppIntroVideoOverlay({ onComplete }: AppIntroVideoOverlayProps) {
  const completedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const finishIntro = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let playbackRequested = false

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.controls = false
    video.autoplay = true
    video.preload = 'auto'
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('disablepictureinpicture', 'true')

    const onEnded = () => finishIntro()
    const onError = () => finishIntro()

    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)

    const playVideo = () => {
      if (playbackRequested) return
      playbackRequested = true

      void video.play().catch(() => {
        finishIntro()
      })
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playVideo()
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true })
      video.addEventListener('canplay', playVideo, { once: true })
    }

    const safetyTimer = window.setTimeout(() => {
      finishIntro()
    }, INTRO_MAX_MS)

    return () => {
      window.clearTimeout(safetyTimer)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
      video.pause()
    }
  }, [finishIntro])

  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <StatusBar hidden />
      {createElement('video', {
        ref: videoRef,
        src: INTRO_VIDEO_SRC,
        style: styles.video,
        muted: true,
        playsInline: true,
        autoPlay: true,
        preload: 'auto',
      })}
      <View style={styles.interactionBlocker} pointerEvents="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
    minHeight: '100dvh',
  },
  video: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000',
    pointerEvents: 'none',
  } as const,
  interactionBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    cursor: 'default',
    userSelect: 'none',
  } as const,
})
