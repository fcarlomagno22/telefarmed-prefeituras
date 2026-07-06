import type { VideoPlayer } from 'expo-video'
import type { AppVideoPlayResult } from './appVideo.types'

export {
  APP_VIDEO_WEB_LIMITATIONS,
  configureRegistrationVideoPlayer,
  getAppVideoPlayFailureMessage,
  getRegistrationVideoViewProps,
} from './appVideo.types'
export type {
  AppVideoPlayFailureReason,
  AppVideoPlayResult,
  RegistrationVideoViewProps,
} from './appVideo.types'

export function isRegistrationVideoAutoplayPolicyStrict(): boolean {
  return false
}

export function markAppVideoUserGesture(): void {
  // Mobile não exige desbloqueio explícito de autoplay.
}

export function canAppVideoAutoplay(): boolean {
  return true
}

export async function safeInvokeVideoPlay(player: VideoPlayer): Promise<boolean> {
  try {
    player.play()
    return true
  } catch {
    return false
  }
}

export async function playAppVideoPlayer(player: VideoPlayer): Promise<AppVideoPlayResult> {
  const started = await safeInvokeVideoPlay(player)
  if (!started) {
    return { ok: false, reason: 'unavailable' }
  }

  return { ok: true }
}
