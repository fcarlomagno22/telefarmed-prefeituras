export type AppAudioModeOptions = {
  playsInSilentMode?: boolean
  shouldPlayInBackground?: boolean
  interruptionMode?: 'mixWithOthers' | 'duckOthers' | 'doNotMix'
}

export type AppAudioPlayFailureReason =
  | 'requires_user_gesture'
  | 'autoplay_blocked'
  | 'unavailable'

export type AppAudioPlayResult =
  | { ok: true }
  | { ok: false; reason: AppAudioPlayFailureReason }

export const APP_AUDIO_WEB_LIMITATIONS = {
  autoplay:
    'Navegadores bloqueiam áudio automático até uma interação do usuário (toque ou clique).',
  background:
    'Reprodução em segundo plano na web é limitada; sons longos podem pausar ao trocar de aba.',
  gesture:
    'Toque em play, seleção de som ou botões de ação desbloqueiam o áudio nesta sessão.',
} as const

export function getAppAudioPlayFailureMessage(reason: AppAudioPlayFailureReason): string {
  switch (reason) {
    case 'requires_user_gesture':
      return APP_AUDIO_WEB_LIMITATIONS.gesture
    case 'autoplay_blocked':
      return APP_AUDIO_WEB_LIMITATIONS.autoplay
    default:
      return 'Áudio indisponível neste navegador.'
  }
}
