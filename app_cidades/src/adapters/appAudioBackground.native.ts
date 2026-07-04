import type { AudioPlayer } from './appAudio'
import type {
  AppAudioLockScreenMetadata,
  SleepPlaybackPlayerOptions,
} from './appAudioBackground.types'
import {
  APP_AUDIO_BACKGROUND_WEB_LIMITATIONS,
  getSleepPlaybackAudioMode as getSharedSleepPlaybackAudioMode,
} from './appAudioBackground.types'

export {
  APP_AUDIO_BACKGROUND_WEB_LIMITATIONS,
  type AppAudioBackgroundCapabilities,
  type AppAudioLockScreenControlsOptions,
  type AppAudioLockScreenMetadata,
  type SleepPlaybackPlayerOptions,
} from './appAudioBackground.types'

const LOCK_SCREEN_CONTROLS = {
  showSeekForward: false,
  showSeekBackward: false,
} as const

export function isAppAudioBackgroundPlaybackSupported(): boolean {
  return true
}

export function isAppAudioLockScreenSupported(): boolean {
  return true
}

export function getAppAudioBackgroundCapabilities() {
  return {
    backgroundPlayback: true,
    lockScreen: true,
  }
}

export function getSleepPlaybackAudioMode() {
  return {
    ...getSharedSleepPlaybackAudioMode(),
    shouldPlayInBackground: true,
  }
}

export function getSleepPlaybackPlayerOptions(
  base: Pick<SleepPlaybackPlayerOptions, 'updateInterval' | 'downloadFirst'>,
): SleepPlaybackPlayerOptions {
  return {
    ...base,
    keepAudioSessionActive: true,
  }
}

export function activateAppAudioLockScreen(
  player: AudioPlayer,
  metadata: AppAudioLockScreenMetadata,
  previousPlayer: AudioPlayer | null,
): AudioPlayer {
  if (previousPlayer && previousPlayer !== player) {
    clearAppAudioLockScreen(previousPlayer)
  }

  player.setActiveForLockScreen(
    true,
    {
      title: metadata.title,
      artist: metadata.artist,
      albumTitle: metadata.albumTitle,
      artworkUrl: metadata.artworkUrl,
    },
    LOCK_SCREEN_CONTROLS,
  )

  return player
}

export function updateAppAudioLockScreenMetadata(
  player: AudioPlayer,
  metadata: AppAudioLockScreenMetadata,
): void {
  player.updateLockScreenMetadata({
    title: metadata.title,
    artist: metadata.artist,
    albumTitle: metadata.albumTitle,
    artworkUrl: metadata.artworkUrl,
  })
}

export function clearAppAudioLockScreen(player: AudioPlayer | null | undefined): void {
  if (!player) return

  try {
    player.clearLockScreenControls()
  } catch {
    // noop
  }
}
