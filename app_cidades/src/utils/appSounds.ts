import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

const failSound = require('../../assets/fail.mp3')
const loginSound = require('../../assets/login.mp3')
const successSound = require('../../assets/success.mp3')
const successPasswordSound = require('../../assets/success_password.mp3')
const functionalAlarmSound = require('../../assets/alarm_funcional.mp3')
const functionalGymMusic = require('../../assets/gym.mp3')
const functionalCountdownTick = require('../../assets/countdown.mp3')

let audioModeReady = false
let functionalAlarmPlayer: AudioPlayer | null = null
let functionalGymPlayer: AudioPlayer | null = null

async function ensureAudioMode() {
  if (audioModeReady) return

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  })
  audioModeReady = true
}

async function playSound(source: number) {
  try {
    await ensureAudioMode()

    const player = createAudioPlayer(source)
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        subscription.remove()
        player.remove()
      }
    })

    player.play()
  } catch {
    // Falha silenciosa: áudio é feedback opcional.
  }
}

export function playFailSound() {
  return playSound(failSound)
}

export function playLoginSound() {
  return playSound(loginSound)
}

export function playSuccessPasswordSound() {
  return playSound(successPasswordSound)
}

export function playSuccessSound() {
  return playSound(successSound)
}

export function playFunctionalCountdownTick() {
  return playSound(functionalCountdownTick)
}

export async function startFunctionalAlarm() {
  try {
    stopFunctionalAlarm()
    await ensureAudioMode()

    const player = createAudioPlayer(functionalAlarmSound)
    player.loop = true
    player.play()
    functionalAlarmPlayer = player
  } catch {
    // Falha silenciosa: áudio é feedback opcional.
  }
}

export function stopFunctionalAlarm() {
  try {
    if (!functionalAlarmPlayer) return

    functionalAlarmPlayer.pause()
    functionalAlarmPlayer.remove()
    functionalAlarmPlayer = null
  } catch {
    functionalAlarmPlayer = null
  }
}

export function isFunctionalAlarmPlaying() {
  return functionalAlarmPlayer?.playing ?? false
}

const DEFAULT_GYM_VOLUME = 0.55
const GYM_VOLUME_STEP = 0.1

let gymVolume = DEFAULT_GYM_VOLUME

function applyGymVolume() {
  if (functionalGymPlayer) {
    functionalGymPlayer.volume = gymVolume
  }
}

export async function startFunctionalGymMusic(volume = gymVolume) {
  try {
    await ensureAudioMode()
    gymVolume = Math.min(1, Math.max(0, volume))

    if (functionalGymPlayer) {
      applyGymVolume()
      functionalGymPlayer.play()
      return
    }

    const player = createAudioPlayer(functionalGymMusic)
    player.loop = true
    player.volume = gymVolume
    player.play()
    functionalGymPlayer = player
  } catch {
    // Falha silenciosa: áudio é feedback opcional.
  }
}

export function pauseFunctionalGymMusic() {
  try {
    functionalGymPlayer?.pause()
  } catch {
    // noop
  }
}

export function resumeFunctionalGymMusic() {
  try {
    functionalGymPlayer?.play()
  } catch {
    // noop
  }
}

export function stopFunctionalGymMusic() {
  try {
    if (!functionalGymPlayer) return

    functionalGymPlayer.pause()
    functionalGymPlayer.remove()
    functionalGymPlayer = null
  } catch {
    functionalGymPlayer = null
  }
}

export function setFunctionalGymMusicVolume(volume: number) {
  gymVolume = Math.min(1, Math.max(0, volume))
  applyGymVolume()
  return gymVolume
}

export function getFunctionalGymMusicVolume() {
  return gymVolume
}

export function increaseFunctionalGymMusicVolume() {
  return setFunctionalGymMusicVolume(gymVolume + GYM_VOLUME_STEP)
}

export function decreaseFunctionalGymMusicVolume() {
  return setFunctionalGymMusicVolume(gymVolume - GYM_VOLUME_STEP)
}

export function isFunctionalGymMusicPlaying() {
  return functionalGymPlayer?.playing ?? false
}

/** @deprecated Use startFunctionalAlarm / stopFunctionalAlarm */
export function playFunctionalAlarmSound() {
  return startFunctionalAlarm()
}
