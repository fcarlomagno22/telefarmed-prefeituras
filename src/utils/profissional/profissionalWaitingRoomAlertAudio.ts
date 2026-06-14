export type ProfissionalSexo = 'masculino' | 'feminino' | 'nao_informado'

export function resolveProfissionalWaitingRoomAlertAudioSrc(
  sexo: ProfissionalSexo | null | undefined,
): string {
  const base = import.meta.env.BASE_URL
  if (sexo === 'feminino') {
    return `${base}mensagem_doutora.mp3`
  }
  return `${base}mensagem_doutor.mp3`
}

/** Desbloqueia autoplay após gesto do usuário (ex.: entrar no plantão). */
export function unlockProfissionalWaitingRoomAlertAudio(
  sexo: ProfissionalSexo | null | undefined,
): void {
  const audio = new Audio(resolveProfissionalWaitingRoomAlertAudioSrc(sexo))
  audio.volume = 0
  void audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.volume = 1
    })
    .catch(() => {
      // Navegador bloqueou autoplay — o alerta tentará de novo no próximo paciente.
    })
}

export function playProfissionalWaitingRoomAlert(
  sexo: ProfissionalSexo | null | undefined,
): void {
  const audio = new Audio(resolveProfissionalWaitingRoomAlertAudioSrc(sexo))
  audio.currentTime = 0
  void audio.play().catch(() => {
    // Ignora falha de autoplay.
  })
}
