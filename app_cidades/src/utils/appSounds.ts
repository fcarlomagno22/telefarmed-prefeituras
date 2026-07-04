import {
  createAppAudioPlayer,
  markAppAudioUserGesture,
  playAppAudioPlayer,
  setAppAudioActiveAsync,
  setAppAudioModeAsync,
  type AudioPlayer,
} from '../adapters/appAudio'

const failSound = require('../../assets/fail.mp3')
const loginSound = require('../../assets/login.mp3')
const successSound = require('../../assets/success.mp3')
const successPasswordSound = require('../../assets/success_password.mp3')
const functionalAlarmSound = require('../../assets/alarm_funcional.mp3')
const functionalGymMusic = require('../../assets/gym.mp3')
const functionalCountdownTick = require('../../assets/countdown.mp3')
const checkSound = require('../../assets/check.mp3')
const pingSound = require('../../assets/ping.mp3')
const winnerSound = require('../../assets/winner.mp3')

let audioModeReady = false
let functionalAlarmPlayer: AudioPlayer | null = null
let functionalGymPlayer: AudioPlayer | null = null

async function ensureAudioMode() {
  if (audioModeReady) return

  await setAppAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  })
  audioModeReady = true
}

async function playSound(source: number) {
  markAppAudioUserGesture()
  try {
    await ensureAudioMode()

    const player = createAppAudioPlayer(source)
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        subscription.remove()
        player.remove()
      }
    })

    playAppAudioPlayer(player)
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

export function playPingSound() {
  return playSound(pingSound)
}

export function playFunctionalCountdownTick() {
  return playSound(functionalCountdownTick)
}

export function playCheckSound() {
  return playSound(checkSound)
}

export function playWinnerSound() {
  return playSound(winnerSound)
}

export async function startFunctionalAlarm() {
  try {
    stopFunctionalAlarm()
    await ensureAudioMode()

    const player = createAppAudioPlayer(functionalAlarmSound)
    player.loop = true
    playAppAudioPlayer(player)
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
      playAppAudioPlayer(functionalGymPlayer)
      return
    }

    const player = createAppAudioPlayer(functionalGymMusic)
    player.loop = true
    player.volume = gymVolume
    playAppAudioPlayer(player)
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
    if (functionalGymPlayer) playAppAudioPlayer(functionalGymPlayer)
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

async function waitForAudioPlayerReady(player: AudioPlayer, timeoutMs = 2000): Promise<void> {
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

async function playOneShotEffect(source: number) {
  markAppAudioUserGesture()
  try {
    await ensureAudioMode()
    await setAppAudioActiveAsync(true)

    const player = createAppAudioPlayer(source, { keepAudioSessionActive: true })
    player.volume = 1

    if (!player.isLoaded) {
      await waitForAudioPlayerReady(player)
    }

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        subscription.remove()
        try {
          player.remove()
        } catch {
          // noop
        }
      }
    })

    playAppAudioPlayer(player)
  } catch {
    // Falha silenciosa: áudio é feedback opcional.
  }
}

function playOneShotEffectNow(source: number) {
  void playOneShotEffect(source)
}

const sudokuCorrectSound = require('../../assets/sounds/correct.mp3')
const sudokuWrongSound = require('../../assets/sounds/wrong.mp3')
const sudokuRevealSound = require('../../assets/sounds/reveal.mp3')
const sudokuCelebrationSound = require('../../assets/sounds/celebration.mp3')

export function preloadSudokuSounds() {
  void ensureAudioMode().then(() => setAppAudioActiveAsync(true))
}

export function releaseSudokuSounds() {
  // Sons do sudoku usam players descartáveis por reprodução.
}

export function playSudokuCorrectSound() {
  playOneShotEffectNow(sudokuCorrectSound)
}

export function playSudokuWrongSound() {
  playOneShotEffectNow(sudokuWrongSound)
}

export function playSudokuRevealSound() {
  playOneShotEffectNow(sudokuRevealSound)
}

export function playSudokuCelebrationSound() {
  playOneShotEffectNow(sudokuCelebrationSound)
}

const palavrasClickSound = require('../../assets/sounds/palavras_click.mp3')
const palavrasBackspaceSound = require('../../assets/sounds/palavras_backspace.mp3')
const somaCorrectSound = require('../../assets/sounds/soma_correct.mp3')
const somaWrongSound = require('../../assets/sounds/soma_wrong.mp3')

export function preloadPalavrasSounds() {
  void ensureAudioMode().then(() => setAppAudioActiveAsync(true))
}

export function releasePalavrasSounds() {
  // Sons de palavras usam players descartáveis por reprodução.
}

export function playPalavrasClickSound() {
  playOneShotEffectNow(palavrasClickSound)
}

export function playPalavrasBackspaceSound() {
  playOneShotEffectNow(palavrasBackspaceSound)
}

export function playFormTheWordCorrectSound() {
  playOneShotEffectNow(somaCorrectSound)
}

export function playFormTheWordWrongSound() {
  playOneShotEffectNow(somaWrongSound)
}
