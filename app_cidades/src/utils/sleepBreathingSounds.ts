import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

const introSound = require('../../assets/sono/inicio_respirar.mp3')
const inhaleSound = require('../../assets/sono/inspira.mp3')
const exhaleSound = require('../../assets/sono/expira.mp3')

export type SleepBreathingSoundId = 'intro' | 'inhale' | 'exhale'

const SOUND_SOURCES: Record<SleepBreathingSoundId, number> = {
  intro: introSound,
  inhale: inhaleSound,
  exhale: exhaleSound,
}

let audioModeReady = false
let activePlayer: AudioPlayer | null = null
let activeSubscription: { remove: () => void } | null = null

async function ensureAudioMode() {
  if (audioModeReady) return

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  })
  audioModeReady = true
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

    const player = createAudioPlayer(SOUND_SOURCES[soundId])
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
    player.play()
  } catch {
    onFinish?.()
  }
}
