import type { AppAudioModeOptions } from './appAudio.types'

export type AppAudioLockScreenControlsOptions = {
  showSeekForward?: boolean
  showSeekBackward?: boolean
}

export type AppAudioLockScreenMetadata = {
  title: string
  artist?: string
  albumTitle?: string
  artworkUrl?: string
}

export type SleepPlaybackPlayerOptions = {
  updateInterval?: number
  downloadFirst?: boolean
  keepAudioSessionActive?: boolean
}

export const APP_AUDIO_BACKGROUND_WEB_LIMITATIONS = {
  background:
    'Reprodução em segundo plano (app minimizado ou aba inativa) não está disponível na web.',
  lockScreen:
    'Controles na tela bloqueada e mini player do sistema são exclusivos do app mobile.',
} as const

export type AppAudioBackgroundCapabilities = {
  backgroundPlayback: boolean
  lockScreen: boolean
}

export function getAppAudioBackgroundCapabilities(): AppAudioBackgroundCapabilities {
  return {
    backgroundPlayback: false,
    lockScreen: false,
  }
}

export function getSleepPlaybackAudioMode(): AppAudioModeOptions {
  return {
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'duckOthers',
  }
}
