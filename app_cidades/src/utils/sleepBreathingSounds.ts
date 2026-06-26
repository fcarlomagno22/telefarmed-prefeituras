import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio'

const introSound = require('../../assets/sono/inicio_respirar.mp3')
const inhaleSound = require('../../assets/sono/inspira.mp3')
const exhaleSound = require('../../assets/sono/expira.mp3')

export type SleepBreathingSoundId = 'intro' | 'inhale' | 'exhale'

const SOUND_SOURCES: Record<SleepBreathingSoundId, number> = {
  intro: introSound,
  inhale: inhaleSound,
  exhale: exhaleSound,
}

let activePlayer: AudioPlayer | null = null
let activeSubscription: { remove: () => void } | null = null

async function ensureAudioMode() {
  await setIsAudioActiveAsync(true)
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'duckOthers',
  })
}

async function waitUntilPlayerLoaded(player: AudioPlayer, timeoutMs = 3000) {
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

function clearActivePlayer() {
  try {
    activeSubscription?.remove()
  } catch {
    // noop
  }

  try {
    activePlayer?.pause()
    activePlayer?.remove()
  } catch {
    // noop
  }

  activeSubscription = null
  activePlayer = null
}

export function stopSleepBreathingSound() {
  clearActivePlayer()
}

export async function playSleepBreathingSound(
  soundId: SleepBreathingSoundId,
  onFinish?: () => void,
) {
  try {
    await ensureAudioMode()
    clearActivePlayer()

    const player = createAudioPlayer(SOUND_SOURCES[soundId], {
      keepAudioSessionActive: true,
    })
    activePlayer = player

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return

      subscription.remove()
      if (activeSubscription === subscription) {
        activeSubscription = null
      }

      try {
        player.remove()
      } catch {
        // noop
      }

      if (activePlayer === player) {
        activePlayer = null
      }

      onFinish?.()
    })

    activeSubscription = subscription
    await waitUntilPlayerLoaded(player)
    player.play()
  } catch {
    onFinish?.()
  }
}
