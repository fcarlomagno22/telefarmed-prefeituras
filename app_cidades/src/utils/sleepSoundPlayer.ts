import { AppState, type AppStateStatus } from 'react-native'
import {
  activateAppAudioLockScreen,
  clearAppAudioLockScreen,
  getSleepPlaybackAudioMode,
  getSleepPlaybackPlayerOptions,
  isAppAudioBackgroundPlaybackSupported,
  isAppAudioLockScreenSupported,
  updateAppAudioLockScreenMetadata,
} from '../adapters/appAudioBackground'
import {
  createAppAudioPlayer,
  playAppAudioPlayer,
  setAppAudioActiveAsync,
  setAppAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from '../adapters/appAudio'
import {
  SLEEP_SOUND_LOCK_SCREEN_ALBUM,
  SLEEP_SOUND_LOCK_SCREEN_ARTIST,
  type SleepSoundLockScreenMetadata,
} from './sleepSoundLockScreen'

const CROSSFADE_SECONDS = 2.8
const CROSSFADE_STEPS = 14
const STATUS_UPDATE_MS = 200
const DEFAULT_VOLUME = 0.65
const VOLUME_STEP = 0.08

async function ensureSleepAudioMode() {
  await setAppAudioActiveAsync(true)
  await setAppAudioModeAsync(getSleepPlaybackAudioMode())
}

async function waitUntilPlayerLoaded(player: AudioPlayer, timeoutMs = 4000) {
  if (player.isLoaded) return

  await Promise.race([
    new Promise<void>((resolve) => {
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded) {
          subscription.remove()
          resolve()
        }
      })
    }),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs)
    }),
  ])
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value))
}

function tryPlay(player: AudioPlayer | null | undefined): boolean {
  if (!player) return false
  return playAppAudioPlayer(player).ok
}

function isBackgroundAppState(state: AppStateStatus) {
  return state === 'background' || state === 'inactive' || state === 'unknown'
}

type PlayerSlot = 'A' | 'B'

export class SleepSoundPlaybackEngine {
  private source: number | null = null
  private playerA: AudioPlayer | null = null
  private playerB: AudioPlayer | null = null
  private subscriptionA: { remove: () => void } | null = null
  private subscriptionB: { remove: () => void } | null = null
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null
  private activeSlot: PlayerSlot = 'A'
  private crossfadeStarted = false
  private masterVolume = DEFAULT_VOLUME
  private timerEndAt: number | null = null
  private timerInterval: ReturnType<typeof setInterval> | null = null
  private onTimerTick: ((remainingSeconds: number | null) => void) | null = null
  private onTimerFinished: (() => void) | null = null
  private onPlaybackStateChange: ((playing: boolean) => void) | null = null
  private lockScreenMetadata: SleepSoundLockScreenMetadata | null = null
  private lockScreenActivePlayer: AudioPlayer | null = null
  private isPaused = false
  private userPaused = false
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null
  private appState: AppStateStatus = AppState.currentState
  private appStateSubscription: { remove: () => void } | null = null

  constructor() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange)
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    const wasBackground = isBackgroundAppState(this.appState)
    this.appState = nextState

    if (nextState === 'active' && wasBackground) {
      void this.onAppForeground()
      return
    }

    if (isBackgroundAppState(nextState)) {
      this.onAppBackground()
    }
  }

  async start(source: number, volume = DEFAULT_VOLUME, metadata?: SleepSoundLockScreenMetadata) {
    await ensureSleepAudioMode()

    if (metadata && isAppAudioLockScreenSupported()) {
      this.lockScreenMetadata = metadata
    }

    if (this.source === source && this.playerA && this.playerB) {
      this.masterVolume = clampVolume(volume)
      if (!this.crossfadeStarted) {
        const active = this.getPlayer(this.activeSlot)
        if (active) active.volume = this.masterVolume
      }
      if (metadata && isAppAudioLockScreenSupported()) {
        this.lockScreenMetadata = metadata
        this.syncLockScreenMetadata()
        this.ensureLockScreenControls(this.getPlayer(this.activeSlot))
      }
      if (!this.userPaused && !this.isPlaying()) {
        tryPlay(this.getPlayer(this.activeSlot))
      }
      return
    }

    this.stopInternal()

    this.source = source
    this.masterVolume = clampVolume(volume)
    this.activeSlot = 'A'
    this.crossfadeStarted = false

    const playerOptions = getSleepPlaybackPlayerOptions({
      updateInterval: STATUS_UPDATE_MS,
      downloadFirst: true,
    })

    this.playerA = createAppAudioPlayer(source, playerOptions)
    this.playerB = createAppAudioPlayer(source, playerOptions)
    this.playerA.volume = this.masterVolume
    this.playerB.volume = 0

    this.subscriptionA = this.playerA.addListener('playbackStatusUpdate', (status) => {
      this.handleStatusUpdate('A', status)
    })
    this.subscriptionB = this.playerB.addListener('playbackStatusUpdate', (status) => {
      this.handleStatusUpdate('B', status)
    })

    await waitUntilPlayerLoaded(this.playerA)
    const started = tryPlay(this.playerA)
    this.isPaused = !started
    this.userPaused = !started
    this.ensureLockScreenControls(this.playerA)
    this.startKeepAlive()
  }

  updateLockScreenArtwork(artworkUrl?: string) {
    if (!isAppAudioLockScreenSupported() || !artworkUrl || !this.lockScreenMetadata) return

    this.lockScreenMetadata = {
      ...this.lockScreenMetadata,
      artworkUrl,
    }
    this.syncLockScreenMetadata()
  }

  onRemotePlaybackStateChange(callback: (playing: boolean) => void) {
    this.onPlaybackStateChange = callback
  }

  pause() {
    if (!this.playerA && !this.playerB) return

    this.isPaused = true
    this.userPaused = true
    this.clearCrossfadeTimer()
    this.crossfadeStarted = false
    this.playerA?.pause()
    this.playerB?.pause()
    this.refreshLockScreenNowPlaying()
    this.onPlaybackStateChange?.(false)
  }

  resume() {
    if (!this.isPaused && !this.userPaused) return

    this.isPaused = false
    this.userPaused = false
    void ensureSleepAudioMode()
    tryPlay(this.getPlayer(this.activeSlot))
    this.ensureLockScreenControls(this.getPlayer(this.activeSlot))
    this.refreshLockScreenNowPlaying()
    this.onPlaybackStateChange?.(true)
  }

  isPausedState() {
    return this.userPaused
  }

  isActive() {
    return this.source != null && (this.playerA != null || this.playerB != null)
  }

  setVolume(volume: number) {
    this.masterVolume = clampVolume(volume)

    if (this.crossfadeStarted) return

    const active = this.getPlayer(this.activeSlot)
    if (active) {
      active.volume = this.masterVolume
    }
  }

  getVolume() {
    return this.masterVolume
  }

  increaseVolume() {
    this.setVolume(this.masterVolume + VOLUME_STEP)
    return this.masterVolume
  }

  decreaseVolume() {
    this.setVolume(this.masterVolume - VOLUME_STEP)
    return this.masterVolume
  }

  setSleepTimer(minutes: number | null, onTick?: (remainingSeconds: number | null) => void) {
    this.clearTimerInterval()
    this.onTimerTick = onTick ?? null

    if (minutes == null) {
      this.timerEndAt = null
      this.onTimerTick?.(null)
      return
    }

    this.timerEndAt = Date.now() + minutes * 60 * 1000
    this.emitTimerTick()

    this.timerInterval = setInterval(() => {
      if (!this.timerEndAt) return

      const remainingMs = this.timerEndAt - Date.now()
      if (remainingMs <= 0) {
        this.emitTimerTick()
        this.onTimerFinished?.()
        this.stop()
        return
      }

      this.emitTimerTick()
    }, 1000)
  }

  onSleepTimerFinished(callback: () => void) {
    this.onTimerFinished = callback
  }

  stop() {
    this.stopInternal()
  }

  isPlaying() {
    return Boolean(this.playerA?.playing || this.playerB?.playing)
  }

  private async onAppForeground() {
    if (!this.source || this.userPaused) return

    await ensureSleepAudioMode()

    const active = this.getPlayer(this.activeSlot)
    if (!active) return

    this.ensureLockScreenControls(active)

    if (!active.playing) {
      tryPlay(active)
    }

    this.isPaused = false
    this.onPlaybackStateChange?.(true)
  }

  private onAppBackground() {
    if (
      !isAppAudioBackgroundPlaybackSupported() ||
      !isAppAudioLockScreenSupported() ||
      !this.source ||
      this.userPaused ||
      !this.lockScreenMetadata
    ) {
      return
    }

    this.ensureLockScreenControls(this.getPlayer(this.activeSlot))
  }

  private stopInternal() {
    this.clearKeepAlive()
    this.clearCrossfadeTimer()
    this.clearTimerInterval()
    this.timerEndAt = null
    this.onTimerTick?.(null)
    this.clearLockScreenControls()

    this.subscriptionA?.remove()
    this.subscriptionB?.remove()
    this.subscriptionA = null
    this.subscriptionB = null

    this.disposePlayer(this.playerA)
    this.disposePlayer(this.playerB)
    this.playerA = null
    this.playerB = null
    this.source = null
    this.crossfadeStarted = false
    this.isPaused = false
    this.userPaused = false
    this.lockScreenMetadata = null
  }

  private emitTimerTick() {
    if (!this.timerEndAt) {
      this.onTimerTick?.(null)
      return
    }

    const remainingSeconds = Math.max(0, Math.ceil((this.timerEndAt - Date.now()) / 1000))
    this.onTimerTick?.(remainingSeconds)
  }

  private clearTimerInterval() {
    if (!this.timerInterval) return
    clearInterval(this.timerInterval)
    this.timerInterval = null
  }

  private clearCrossfadeTimer() {
    if (!this.crossfadeTimer) return
    clearInterval(this.crossfadeTimer)
    this.crossfadeTimer = null
  }

  private disposePlayer(player: AudioPlayer | null) {
    if (!player) return

    try {
      if (this.lockScreenActivePlayer === player) {
        clearAppAudioLockScreen(player)
        this.lockScreenActivePlayer = null
      }
      player.pause()
      player.remove()
    } catch {
      // noop
    }
  }

  private getPlayer(slot: PlayerSlot) {
    return slot === 'A' ? this.playerA : this.playerB
  }

  private isAtLoopPoint(status: AudioStatus) {
    if (status.didJustFinish) return true
    if (status.duration <= 0) return false

    return status.currentTime >= Math.max(0, status.duration - CROSSFADE_SECONDS - 0.25)
  }

  private handleStatusUpdate(slot: PlayerSlot, status: AudioStatus) {
    if (slot !== this.activeSlot) return

    if (!this.userPaused && status.isLoaded && !this.crossfadeStarted) {
      this.maybeBeginCrossfade(status)
    }

    this.syncRemotePlaybackState(status)

    if (status.isLoaded && this.lockScreenMetadata && isAppAudioLockScreenSupported()) {
      this.ensureLockScreenControls(this.getPlayer(this.activeSlot))
    }
  }

  private maybeBeginCrossfade(status: AudioStatus) {
    if (status.duration > 0) {
      const remaining = status.duration - status.currentTime
      if (remaining <= CROSSFADE_SECONDS) {
        void this.beginCrossfade()
        return
      }
    }

    if (status.didJustFinish || (!status.playing && this.isAtLoopPoint(status))) {
      void this.beginCrossfade()
    }
  }

  private syncRemotePlaybackState(status: AudioStatus) {
    if (!status.isLoaded || this.crossfadeStarted) return

    if (status.playing) {
      if (this.isPaused || this.userPaused) {
        this.isPaused = false
        this.userPaused = false
        this.onPlaybackStateChange?.(true)
      }
      return
    }

    if (this.userPaused) return

    if (this.isAtLoopPoint(status)) {
      void this.beginCrossfade()
      return
    }

    if (isBackgroundAppState(this.appState) && isAppAudioBackgroundPlaybackSupported()) {
      const active = this.getPlayer(this.activeSlot)
      if (active) {
        tryPlay(active)
      }
      return
    }

    if (!this.crossfadeStarted) {
      const active = this.getPlayer(this.activeSlot)
      if (active && !active.playing) {
        tryPlay(active)
      }
    }
  }

  private startKeepAlive() {
    this.clearKeepAlive()

    this.keepAliveTimer = setInterval(() => {
      if (!this.source || this.userPaused || this.crossfadeStarted) return
      if (this.isPlaying()) return

      void this.beginCrossfade()
    }, 1200)
  }

  private clearKeepAlive() {
    if (!this.keepAliveTimer) return
    clearInterval(this.keepAliveTimer)
    this.keepAliveTimer = null
  }

  private ensureLockScreenControls(player: AudioPlayer | null | undefined) {
    if (!isAppAudioLockScreenSupported() || !player || !this.lockScreenMetadata) return

    this.lockScreenActivePlayer = activateAppAudioLockScreen(
      player,
      this.toLockScreenMetadata(),
      this.lockScreenActivePlayer,
    )
  }

  private toLockScreenMetadata() {
    if (!this.lockScreenMetadata) {
      throw new Error('Lock screen metadata unavailable')
    }

    return {
      title: this.lockScreenMetadata.title,
      artist: this.lockScreenMetadata.artist ?? SLEEP_SOUND_LOCK_SCREEN_ARTIST,
      albumTitle: this.lockScreenMetadata.albumTitle ?? SLEEP_SOUND_LOCK_SCREEN_ALBUM,
      artworkUrl: this.lockScreenMetadata.artworkUrl,
    }
  }

  private syncLockScreenMetadata() {
    if (
      !isAppAudioLockScreenSupported() ||
      !this.lockScreenMetadata ||
      !this.lockScreenActivePlayer
    ) {
      return
    }

    updateAppAudioLockScreenMetadata(this.lockScreenActivePlayer, this.toLockScreenMetadata())
  }

  private refreshLockScreenNowPlaying() {
    if (!isAppAudioLockScreenSupported() || !this.lockScreenActivePlayer) return

    try {
      updateAppAudioLockScreenMetadata(this.lockScreenActivePlayer, this.toLockScreenMetadata())
    } catch {
      // noop
    }
  }

  private clearLockScreenControls() {
    if (!isAppAudioLockScreenSupported()) {
      this.lockScreenActivePlayer = null
      return
    }

    clearAppAudioLockScreen(this.lockScreenActivePlayer)
    this.lockScreenActivePlayer = null
  }

  private async beginCrossfade() {
    if (this.crossfadeStarted || !this.source || this.userPaused) return

    const outgoingSlot = this.activeSlot
    const incomingSlot: PlayerSlot = outgoingSlot === 'A' ? 'B' : 'A'
    const outgoing = this.getPlayer(outgoingSlot)
    const incoming = this.getPlayer(incomingSlot)

    if (!outgoing || !incoming) return

    this.crossfadeStarted = true

    try {
      await incoming.seekTo(0)
    } catch {
      // noop
    }

    incoming.volume = 0
    this.ensureLockScreenControls(incoming)
    tryPlay(incoming)

    let step = 0
    const intervalMs = Math.max(80, Math.round((CROSSFADE_SECONDS * 1000) / CROSSFADE_STEPS))

    this.clearCrossfadeTimer()
    this.crossfadeTimer = setInterval(() => {
      step += 1
      const progress = Math.min(1, step / CROSSFADE_STEPS)

      outgoing.volume = this.masterVolume * (1 - progress)
      incoming.volume = this.masterVolume * progress

      if (progress >= 1) {
        this.clearCrossfadeTimer()
        outgoing.pause()
        void outgoing.seekTo(0)
        outgoing.volume = 0
        this.activeSlot = incomingSlot
        this.crossfadeStarted = false
        this.ensureLockScreenControls(incoming)
        this.onPlaybackStateChange?.(true)
      }
    }, intervalMs)
  }
}

let sharedEngine: SleepSoundPlaybackEngine | null = null

export function getSleepSoundPlaybackEngine() {
  if (!sharedEngine) {
    sharedEngine = new SleepSoundPlaybackEngine()
  }
  return sharedEngine
}

export function stopSleepSoundPlayback() {
  sharedEngine?.stop()
}

export const DEFAULT_SLEEP_SOUND_VOLUME = 0.65
export const SLEEP_SOUND_VOLUME_STEP = 0.08
