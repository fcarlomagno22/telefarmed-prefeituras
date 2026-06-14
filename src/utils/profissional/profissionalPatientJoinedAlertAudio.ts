const PATIENT_JOINED_ALERT_SRC = `${import.meta.env.BASE_URL}2_sec_doctor.mp3`

export function unlockProfissionalPatientJoinedAlertAudio(): void {
  const audio = new Audio(PATIENT_JOINED_ALERT_SRC)
  audio.volume = 0
  void audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.volume = 1
    })
    .catch(() => {
      // Navegador bloqueou autoplay.
    })
}

export function playProfissionalPatientJoinedAlert(): void {
  const audio = new Audio(PATIENT_JOINED_ALERT_SRC)
  audio.currentTime = 0
  void audio.play().catch(() => {
    // Ignora falha de autoplay.
  })
}
