import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioPlayerOptions,
  type AudioSource,
  type AudioStatus,
} from 'expo-audio'
import type { AppAudioModeOptions, AppAudioPlayResult } from './appAudio.types'

export { APP_AUDIO_WEB_LIMITATIONS, getAppAudioPlayFailureMessage } from './appAudio.types'
export type {
  AppAudioModeOptions,
  AppAudioPlayFailureReason,
  AppAudioPlayResult,
} from './appAudio.types'
export type { AudioPlayer, AudioPlayerOptions, AudioSource, AudioStatus }

export function markAppAudioUserGesture(): void {
  return undefined
}

export function isAppAudioUnlocked(): boolean {
  return true
}

export function canAppAudioAutoplay(): boolean {
  return true
}

export async function setAppAudioModeAsync({
  playsInSilentMode = true,
  shouldPlayInBackground = false,
  interruptionMode = 'mixWithOthers',
}: AppAudioModeOptions = {}): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode,
    shouldPlayInBackground,
    interruptionMode,
  })
}

export async function setAppAudioActiveAsync(active: boolean): Promise<void> {
  await setIsAudioActiveAsync(active)
}

export function createAppAudioPlayer(
  source: AudioSource,
  options?: AudioPlayerOptions,
): AudioPlayer {
  return createAudioPlayer(source, options)
}

export function playAppAudioPlayer(player: AudioPlayer): AppAudioPlayResult {
  try {
    player.play()
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}
