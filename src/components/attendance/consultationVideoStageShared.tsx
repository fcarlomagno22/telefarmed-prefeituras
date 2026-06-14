import { Camera, CameraOff, Mic, MicOff, Signal, SignalHigh, SignalLow, SignalZero } from 'lucide-react'
import type { ConsultationVideoConnectionState } from '../../hooks/useConsultationVideoCall'

export type ConsultationVideoStageHandle = {
  disconnect: () => void
}

export function isPermissionRelatedError(message: string | null): boolean {
  if (!message) return false
  const normalized = message.toLowerCase()
  return (
    normalized.includes('permission') ||
    normalized.includes('permiss') ||
    normalized.includes('notallowed') ||
    normalized.includes('denied')
  )
}

export function connectionStatusLabel(
  state: ConsultationVideoConnectionState,
  hasRemoteVideo: boolean,
  videoEnabled: boolean,
  waitingFor: 'medico' | 'paciente',
): string {
  if (!videoEnabled && state === 'idle') {
    return 'Desconectado'
  }

  switch (state) {
    case 'connecting':
      return 'Conectando…'
    case 'connected':
      return hasRemoteVideo
        ? 'Ao vivo'
        : waitingFor === 'medico'
          ? 'Aguardando médico'
          : 'Aguardando paciente'
    case 'error':
      return 'Sem conexão'
    default:
      return videoEnabled ? 'Preparando' : 'Desconectado'
  }
}

type ConnectionSignalIconProps = {
  state: ConsultationVideoConnectionState
  hasRemoteVideo: boolean
  videoEnabled: boolean
}

export function ConnectionSignalIcon({ state, hasRemoteVideo, videoEnabled }: ConnectionSignalIconProps) {
  if (!videoEnabled && state === 'idle') {
    return <SignalZero className="h-4 w-4 text-white/45" strokeWidth={2} />
  }

  if (state === 'error') {
    return <SignalLow className="h-4 w-4 text-red-300" strokeWidth={2} />
  }

  if (state === 'connecting') {
    return <Signal className="h-4 w-4 animate-pulse text-amber-200" strokeWidth={2} />
  }

  if (state === 'connected' && hasRemoteVideo) {
    return <SignalHigh className="h-4 w-4 text-emerald-300" strokeWidth={2} />
  }

  if (state === 'connected') {
    return <Signal className="h-4 w-4 text-white/80" strokeWidth={2} />
  }

  return <SignalZero className="h-4 w-4 text-white/45" strokeWidth={2} />
}

type ConsultationVideoMediaControlsProps = {
  connectionState: ConsultationVideoConnectionState
  isMicEnabled: boolean
  isCameraEnabled: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
}

export function ConsultationVideoMediaControls({
  connectionState,
  isMicEnabled,
  isCameraEnabled,
  onToggleMic,
  onToggleCamera,
}: ConsultationVideoMediaControlsProps) {
  const controlsDisabled = connectionState !== 'connected'

  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
      <button
        type="button"
        onClick={() => void onToggleMic()}
        disabled={controlsDisabled}
        aria-label={isMicEnabled ? 'Desativar microfone' : 'Ativar microfone'}
        aria-pressed={!isMicEnabled}
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition',
          controlsDisabled
            ? 'cursor-not-allowed border-white/10 bg-black/25 text-white/35'
            : isMicEnabled
              ? 'border-white/20 bg-black/50 text-white hover:bg-black/65'
              : 'border-red-400/40 bg-red-950/70 text-red-100 hover:bg-red-950/85',
        ].join(' ')}
      >
        {isMicEnabled ? (
          <Mic className="h-4 w-4" strokeWidth={2.25} />
        ) : (
          <MicOff className="h-4 w-4" strokeWidth={2.25} />
        )}
      </button>

      <button
        type="button"
        onClick={() => void onToggleCamera()}
        disabled={controlsDisabled}
        aria-label={isCameraEnabled ? 'Desativar câmera' : 'Ativar câmera'}
        aria-pressed={!isCameraEnabled}
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition',
          controlsDisabled
            ? 'cursor-not-allowed border-white/10 bg-black/25 text-white/35'
            : isCameraEnabled
              ? 'border-white/20 bg-black/50 text-white hover:bg-black/65'
              : 'border-red-400/40 bg-red-950/70 text-red-100 hover:bg-red-950/85',
        ].join(' ')}
      >
        {isCameraEnabled ? (
          <Camera className="h-4 w-4" strokeWidth={2.25} />
        ) : (
          <CameraOff className="h-4 w-4" strokeWidth={2.25} />
        )}
      </button>
    </div>
  )
}

export function resolveConsultationOverlayMessage(options: {
  permissionError: boolean
  connectionError: boolean
  isConnecting: boolean
  isConnected: boolean
  hasRemoteVideo: boolean
  errorMessage: string | null
  waitingFor: 'medico' | 'paciente'
}): string | null {
  if (options.permissionError) {
    return 'Permita câmera e microfone para participar da teleconsulta.'
  }
  if (options.connectionError) {
    return options.errorMessage ?? 'Não foi possível conectar à teleconsulta.'
  }
  if (options.isConnecting) {
    return 'Conectando à teleconsulta…'
  }
  if (options.isConnected && !options.hasRemoteVideo) {
    return options.waitingFor === 'medico'
      ? 'Aguardando o profissional entrar na sala…'
      : 'Aguardando o paciente entrar na sala…'
  }
  return null
}
