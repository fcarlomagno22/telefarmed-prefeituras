/**
 * Web: expo-audio com desbloqueio explícito por gesto do usuário.
 * Evita falso sucesso quando autoplay é bloqueado pelo navegador.
 */
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

let audioUnlocked = false
let gestureListenersInstalled = false

function installGestureUnlockListeners() {
  if (gestureListenersInstalled || typeof window === 'undefined') return

  gestureListenersInstalled = true

  const unlock = () => {
    markAppAudioUserGesture()
  }

  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock)
  window.addEventListener('touchstart', unlock, { passive: true })
}

installGestureUnlockListeners()

export function markAppAudioUserGesture(): void {
  audioUnlocked = true
  void setIsAudioActiveAsync(true).catch(() => undefined)
}

export function isAppAudioUnlocked(): boolean {
  return audioUnlocked
}

export function canAppAudioAutoplay(): boolean {
  return audioUnlocked
}

export async function setAppAudioModeAsync({
  playsInSilentMode = true,
  interruptionMode = 'mixWithOthers',
}: AppAudioModeOptions = {}): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode,
      shouldPlayInBackground: false,
      interruptionMode,
    })
  } catch {
    // Modo de áudio nativo não se aplica totalmente na web.
  }
}

export async function setAppAudioActiveAsync(active: boolean): Promise<void> {
  try {
    await setIsAudioActiveAsync(active)
  } catch {
    // noop
  }

  if (active) {
    audioUnlocked = true
  }
}

export function createAppAudioPlayer(
  source: AudioSource,
  options?: AudioPlayerOptions,
): AudioPlayer {
  return createAudioPlayer(source, options)
}

export function playAppAudioPlayer(player: AudioPlayer): AppAudioPlayResult {
  if (!audioUnlocked) {
    return { ok: false, reason: 'requires_user_gesture' }
  }

  try {
    player.play()
    return { ok: true }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : ''
    if (errorName === 'NotAllowedError') {
      audioUnlocked = false
      return { ok: false, reason: 'autoplay_blocked' }
    }

    return { ok: false, reason: 'unavailable' }
  }
}
