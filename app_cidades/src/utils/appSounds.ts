import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'

const failSound = require('../../assets/fail.mp3')
const loginSound = require('../../assets/login.mp3')
const successSound = require('../../assets/success.mp3')
const successPasswordSound = require('../../assets/success_password.mp3')

let audioModeReady = false

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
