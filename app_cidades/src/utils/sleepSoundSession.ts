import type { SleepTimerMinutes } from '../components/sleepTime/sleepTimeSoundTypes'
import type { SleepSoundId } from '../types/sleepTime'
import { DEFAULT_SLEEP_SOUND_VOLUME } from './sleepSoundPlayer'

export type SleepSoundSessionSnapshot = {
  soundId: SleepSoundId | null
  volume: number
  timerMinutes: SleepTimerMinutes
}

let snapshot: SleepSoundSessionSnapshot = {
  soundId: null,
  volume: DEFAULT_SLEEP_SOUND_VOLUME,
  timerMinutes: null,
}

const listeners = new Set<(next: SleepSoundSessionSnapshot) => void>()

export function getSleepSoundSessionSnapshot(): SleepSoundSessionSnapshot {
  return snapshot
}

export function patchSleepSoundSession(partial: Partial<SleepSoundSessionSnapshot>) {
  snapshot = { ...snapshot, ...partial }
  listeners.forEach((listener) => listener(snapshot))
}

export function clearSleepSoundSession() {
  patchSleepSoundSession({
    soundId: null,
    timerMinutes: null,
  })
}

export function subscribeSleepSoundSession(listener: (next: SleepSoundSessionSnapshot) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
