import { BadgeCheck, Mic, MicOff } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useConsultationVideoCall } from '../../../hooks/useConsultationVideoCall'
import {
  connectionStatusLabel,
  ConnectionSignalIcon,
  ConsultationVideoMediaControls,
  isPermissionRelatedError,
  resolveConsultationOverlayMessage,
  type ConsultationVideoStageHandle,
} from '../consultationVideoStageShared'
import { doctorConsultationCardClass } from './doctorConsultationUi'

type DoctorConsultationVideoStageProps = {
  codigoAtendimento: string
  getAccessToken: () => string | null
  videoEnabled: boolean
  patientName: string
  patientCpfMasked: string
  patientAgeGender: string
  patientVideoPosterUrl: string
  doctorPhotoUrl: string
  onViewClinicalTriage?: () => void
  className?: string
}

export const DoctorConsultationVideoStage = forwardRef<
  ConsultationVideoStageHandle,
  DoctorConsultationVideoStageProps
>(function DoctorConsultationVideoStage(
  {
    codigoAtendimento,
    getAccessToken,
    videoEnabled,
    patientName,
    patientCpfMasked,
    patientAgeGender,
    patientVideoPosterUrl,
    doctorPhotoUrl,
    onViewClinicalTriage,
    className,
  },
  ref,
) {
  const patientVideoRef = useRef<HTMLVideoElement>(null)
  const doctorVideoRef = useRef<HTMLVideoElement>(null)

  const {
    connectionState,
    localVideoTrack,
    remoteVideoTrack,
    errorMessage,
    isMicEnabled,
    isCameraEnabled,
    toggleMic,
    toggleCamera,
    disconnect,
  } = useConsultationVideoCall({
    role: 'medico',
    codigoOrToken: codigoAtendimento,
    getAccessToken,
    enabled: videoEnabled,
  })

  useImperativeHandle(ref, () => ({ disconnect }), [disconnect])

  const hasRemoteVideo = Boolean(remoteVideoTrack)
  const hasLocalVideo = Boolean(localVideoTrack)
  const isConnecting = connectionState === 'connecting'
  const isConnected = connectionState === 'connected'
  const permissionError =
    isPermissionRelatedError(errorMessage) ||
    (isConnected && !hasLocalVideo && !isConnecting && videoEnabled)
  const connectionError = connectionState === 'error' && !permissionError

  useEffect(() => {
    const element = patientVideoRef.current
    if (!element || !remoteVideoTrack) return

    remoteVideoTrack.attach(element)
    void element.play().catch(() => undefined)

    return () => {
      remoteVideoTrack.detach()
    }
  }, [remoteVideoTrack])

  useEffect(() => {
    const element = doctorVideoRef.current
    if (!element || !localVideoTrack) return

    localVideoTrack.attach(element)
    void element.play().catch(() => undefined)

    return () => {
      localVideoTrack.detach()
    }
  }, [localVideoTrack])

  const showPatientPoster = !hasRemoteVideo
  const pipShowPhoto = !hasLocalVideo
  const pipStarting = videoEnabled && (isConnecting || (isConnected && !hasLocalVideo && !permissionError))

  const patientOverlayMessage = resolveConsultationOverlayMessage({
    permissionError,
    connectionError,
    isConnecting,
    isConnected,
    hasRemoteVideo,
    errorMessage,
    waitingFor: 'paciente',
  })

  return (
    <section
      className={[doctorConsultationCardClass, 'h-full min-h-0 p-0', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl bg-gray-900">
        {showPatientPoster ? (
          <img
            src={patientVideoPosterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : null}

        <video
          ref={patientVideoRef}
          autoPlay
          playsInline
          muted
          className={[
            'absolute inset-0 h-full w-full object-cover object-center',
            hasRemoteVideo ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          aria-label={`Vídeo de ${patientName}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {patientOverlayMessage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-6 text-center">
            <p className="max-w-sm text-sm font-medium leading-snug text-white">{patientOverlayMessage}</p>
          </div>
        ) : null}

        <div
          className="absolute left-4 top-4 z-10 flex h-9 items-center gap-1.5 rounded-lg bg-black/35 px-2 text-white backdrop-blur-sm"
          title={connectionStatusLabel(connectionState, hasRemoteVideo, videoEnabled, 'paciente')}
        >
          <ConnectionSignalIcon
            state={connectionState}
            hasRemoteVideo={hasRemoteVideo}
            videoEnabled={videoEnabled}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
            {connectionStatusLabel(connectionState, hasRemoteVideo, videoEnabled, 'paciente')}
          </span>
        </div>

        <ConsultationVideoMediaControls
          connectionState={connectionState}
          isMicEnabled={isMicEnabled}
          isCameraEnabled={isCameraEnabled}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
        />

        <div className="absolute right-4 top-4 h-[88px] w-[120px] overflow-hidden rounded-xl border-2 border-white/90 bg-gray-950 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[96px] sm:w-[132px]">
          <video
            ref={doctorVideoRef}
            autoPlay
            playsInline
            muted
            className={[
              'h-full w-full scale-x-[-1] object-cover',
              hasLocalVideo ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0',
            ].join(' ')}
            aria-label="Sua câmera"
          />

          {pipShowPhoto ? (
            <>
              <img
                src={doctorPhotoUrl}
                alt=""
                className={[
                  'h-full w-full object-cover',
                  pipStarting ? 'opacity-40' : 'opacity-100',
                ].join(' ')}
              />
              {pipStarting ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-2 text-center text-[10px] font-medium leading-snug text-white">
                  Ativando câmera e microfone…
                </div>
              ) : null}
            </>
          ) : null}

          {hasLocalVideo || isConnected ? (
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {isMicEnabled ? (
                <Mic className="h-3 w-3 text-emerald-300" strokeWidth={2.5} />
              ) : (
                <MicOff className="h-3 w-3 text-red-300" strokeWidth={2.5} />
              )}
              Você
            </div>
          ) : null}

          {permissionError ? (
            <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-md bg-red-950/85 px-1.5 py-1 text-center text-[9px] font-medium leading-snug text-red-100">
              <MicOff className="h-3 w-3 shrink-0" strokeWidth={2.5} />
              Verifique as permissões do navegador
            </div>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 z-10 max-w-[min(calc(100%-2rem),280px)] rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-white shadow-lg backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
            {patientName}
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
          </p>
          <p className="mt-1 text-xs text-white/90">CPF {patientCpfMasked}</p>
          <p className="mt-0.5 text-xs text-white/75">{patientAgeGender}</p>
          {onViewClinicalTriage ? (
            <button
              type="button"
              onClick={onViewClinicalTriage}
              className="mt-2 text-left text-xs font-semibold text-sky-300 underline-offset-2 transition hover:text-sky-200 hover:underline"
            >
              Ver triagem clínica
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
})
