import type { VideoPlayer, VideoViewProps } from 'expo-video'

export type AppVideoPlayFailureReason =
  | 'requires_user_gesture'
  | 'autoplay_blocked'
  | 'unavailable'

export type AppVideoPlayResult =
  | { ok: true }
  | { ok: false; reason: AppVideoPlayFailureReason }

export type RegistrationVideoViewProps = Pick<
  VideoViewProps,
  'nativeControls' | 'allowsFullscreen' | 'allowsPictureInPicture' | 'contentFit' | 'playsInline'
>

export const APP_VIDEO_WEB_LIMITATIONS = {
  autoplay:
    'Navegadores bloqueiam vídeo com som automático até uma interação do usuário (toque ou clique).',
  controls:
    'Controles nativos do player ficam desativados; use o botão exibido quando o autoplay for bloqueado.',
  background:
    'Reprodução pode pausar ao trocar de aba ou minimizar o navegador.',
} as const

export function getAppVideoPlayFailureMessage(reason: AppVideoPlayFailureReason): string {
  switch (reason) {
    case 'requires_user_gesture':
      return 'Toque em "Iniciar apresentação" para continuar.'
    case 'autoplay_blocked':
      return APP_VIDEO_WEB_LIMITATIONS.autoplay
    default:
      return 'Vídeo indisponível neste navegador.'
  }
}

export function configureRegistrationVideoPlayer(player: VideoPlayer): void {
  player.loop = false
  player.timeUpdateEventInterval = 0.2
  player.muted = false
}

export function getRegistrationVideoViewProps(): RegistrationVideoViewProps {
  return {
    nativeControls: false,
    allowsFullscreen: false,
    allowsPictureInPicture: false,
    contentFit: 'cover',
  }
}
