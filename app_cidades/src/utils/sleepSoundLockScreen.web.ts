/**
 * Web: lock screen e permissões de notificação para Now Playing são mobile-only.
 * Playback continua via appAudio/appAudioBackground no foreground.
 */
import {
  isAppAudioBackgroundPlaybackSupported,
  isAppAudioLockScreenSupported,
} from '../adapters/appAudioBackground'

export {
  SLEEP_SOUND_LOCK_SCREEN_ALBUM,
  SLEEP_SOUND_LOCK_SCREEN_ARTIST,
  type SleepSoundLockScreenMetadata,
} from './sleepSoundLockScreenShared'

export function isSleepSoundLockScreenSupported(): boolean {
  return isAppAudioLockScreenSupported()
}

export function isSleepSoundBackgroundPlaybackSupported(): boolean {
  return isAppAudioBackgroundPlaybackSupported()
}

export async function getSleepSoundLockScreenArtworkUrl(): Promise<string | undefined> {
  return undefined
}

export async function ensureSleepSoundPlaybackPermissions(): Promise<boolean> {
  return true
}
