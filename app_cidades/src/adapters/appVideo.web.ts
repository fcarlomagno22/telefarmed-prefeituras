/**
 * Web: política de autoplay e props do player de cadastro.
 */
import type { VideoPlayer } from 'expo-video'
import { canAppAudioAutoplay, markAppAudioUserGesture } from './appAudio'
import type { AppVideoPlayResult } from './appVideo.types'

export {
  APP_VIDEO_WEB_LIMITATIONS,
  configureRegistrationVideoPlayer,
  getAppVideoPlayFailureMessage,
} from './appVideo.types'
export type {
  AppVideoPlayFailureReason,
  AppVideoPlayResult,
  RegistrationVideoViewProps,
} from './appVideo.types'

const PLAYBACK_CONFIRM_MS = 200

export function isRegistrationVideoAutoplayPolicyStrict(): boolean {
  return true
}

export function markAppVideoUserGesture(): void {
  markAppAudioUserGesture()
}

export function canAppVideoAutoplay(): boolean {
  return canAppAudioAutoplay()
}

export function getRegistrationVideoViewProps() {
  return {
    nativeControls: false,
    allowsFullscreen: false,
    allowsPictureInPicture: false,
    contentFit: 'contain' as const,
    playsInline: true,
  }
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

export async function playAppVideoPlayer(player: VideoPlayer): Promise<AppVideoPlayResult> {
  if (!canAppVideoAutoplay()) {
    return { ok: false, reason: 'requires_user_gesture' }
  }

  try {
    player.play()
    const started = await waitForPlayback(player, PLAYBACK_CONFIRM_MS)
    if (!started) {
      return { ok: false, reason: 'autoplay_blocked' }
    }

    return { ok: true }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : ''
    if (errorName === 'NotAllowedError') {
      return { ok: false, reason: 'autoplay_blocked' }
    }

    return { ok: false, reason: 'unavailable' }
  }
}
