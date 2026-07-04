/**
 * Web: background audio e lock screen são mobile-only — stubs explícitos.
 */
import type { AudioPlayer } from './appAudio'
import type {
  AppAudioLockScreenMetadata,
  SleepPlaybackPlayerOptions,
} from './appAudioBackground.types'
import {
  APP_AUDIO_BACKGROUND_WEB_LIMITATIONS,
  getAppAudioBackgroundCapabilities as getSharedCapabilities,
  getSleepPlaybackAudioMode,
} from './appAudioBackground.types'

export {
  APP_AUDIO_BACKGROUND_WEB_LIMITATIONS,
  type AppAudioBackgroundCapabilities,
  type AppAudioLockScreenControlsOptions,
  type AppAudioLockScreenMetadata,
  type SleepPlaybackPlayerOptions,
} from './appAudioBackground.types'

export function isAppAudioBackgroundPlaybackSupported(): boolean {
  return false
}

export function isAppAudioLockScreenSupported(): boolean {
  return false
}

export function getAppAudioBackgroundCapabilities() {
  return getSharedCapabilities()
}

export { getSleepPlaybackAudioMode }

export function getSleepPlaybackPlayerOptions(
  base: Pick<SleepPlaybackPlayerOptions, 'updateInterval' | 'downloadFirst'>,
): SleepPlaybackPlayerOptions {
  return { ...base }
}

export function activateAppAudioLockScreen(
  player: AudioPlayer,
  _metadata: AppAudioLockScreenMetadata,
  _previousPlayer: AudioPlayer | null,
): AudioPlayer {
  return player
}

export function updateAppAudioLockScreenMetadata(
  _player: AudioPlayer,
  _metadata: AppAudioLockScreenMetadata,
): void {
  return undefined
}

export function clearAppAudioLockScreen(_player: AudioPlayer | null | undefined): void {
  return undefined
}
