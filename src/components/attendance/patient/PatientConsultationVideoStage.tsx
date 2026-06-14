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
import { patientConsultationCardClass } from './patientConsultationUi'

type PatientConsultationVideoStageProps = {
  atendimentoToken: string
  videoEnabled: boolean
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorVideoPosterUrl: string
  patientPhotoUrl: string
  className?: string
}

export const PatientConsultationVideoStage = forwardRef<
  ConsultationVideoStageHandle,
  PatientConsultationVideoStageProps
>(function PatientConsultationVideoStage(
  {
    atendimentoToken,
    videoEnabled,
    doctorName,
    doctorSpecialty,
    doctorCrm,
    doctorVideoPosterUrl,
    patientPhotoUrl,
    className,
  },
  ref,
) {
  const doctorVideoRef = useRef<HTMLVideoElement>(null)
  const patientVideoRef = useRef<HTMLVideoElement>(null)

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
    role: 'paciente',
    codigoOrToken: atendimentoToken,
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
    const element = doctorVideoRef.current
    if (!element || !remoteVideoTrack) return

    remoteVideoTrack.attach(element)
    void element.play().catch(() => undefined)

    return () => {
      remoteVideoTrack.detach()
    }
  }, [remoteVideoTrack])

  useEffect(() => {
    const element = patientVideoRef.current
    if (!element || !localVideoTrack) return

    localVideoTrack.attach(element)
    void element.play().catch(() => undefined)

    return () => {
      localVideoTrack.detach()
    }
  }, [localVideoTrack])

  const showDoctorPoster = !hasRemoteVideo
  const pipShowPhoto = !hasLocalVideo
  const pipStarting = videoEnabled && (isConnecting || (isConnected && !hasLocalVideo && !permissionError))

  const doctorOverlayMessage = resolveConsultationOverlayMessage({
    permissionError,
    connectionError,
    isConnecting,
    isConnected,
    hasRemoteVideo,
    errorMessage,
    waitingFor: 'medico',
  })

  return (
    <section
      className={[patientConsultationCardClass, 'h-full min-h-0 p-0', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl bg-gray-900">
        {showDoctorPoster ? (
          <img
            src={doctorVideoPosterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : null}

        <video
          ref={doctorVideoRef}
          autoPlay
          playsInline
          muted
          className={[
            'absolute inset-0 h-full w-full object-cover object-center',
            hasRemoteVideo ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          aria-label={`Vídeo de ${doctorName}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {doctorOverlayMessage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-6 text-center">
            <p className="max-w-sm text-sm font-medium leading-snug text-white">{doctorOverlayMessage}</p>
          </div>
        ) : null}

        <div
          className="absolute left-4 top-4 flex h-9 items-center gap-1.5 rounded-lg bg-black/35 px-2 text-white backdrop-blur-sm"
          title={connectionStatusLabel(connectionState, hasRemoteVideo, videoEnabled, 'medico')}
        >
          <ConnectionSignalIcon
            state={connectionState}
            hasRemoteVideo={hasRemoteVideo}
            videoEnabled={videoEnabled}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
            {connectionStatusLabel(connectionState, hasRemoteVideo, videoEnabled, 'medico')}
          </span>
        </div>

        <ConsultationVideoMediaControls
          connectionState={connectionState}
          isMicEnabled={isMicEnabled}
          isCameraEnabled={isCameraEnabled}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
        />

        <div className="absolute bottom-4 left-4 max-w-[min(calc(100%-2rem),320px)] rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-white shadow-lg backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
            {doctorName}
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
          </p>
          <p className="mt-0.5 text-xs text-white/85">
            {doctorSpecialty} • CRM {doctorCrm}
          </p>
        </div>

        <div className="absolute bottom-4 right-4 h-[108px] w-[152px] overflow-hidden rounded-xl border-2 border-white/90 bg-gray-950 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[120px] sm:w-[168px]">
          <video
            ref={patientVideoRef}
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
                src={patientPhotoUrl}
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
      </div>
    </section>
  )
})
