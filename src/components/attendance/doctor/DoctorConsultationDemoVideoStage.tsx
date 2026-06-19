import { BadgeCheck, History, Mic, MicOff, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import {
  ConnectionSignalIcon,
  ConsultationVideoMediaControls,
} from '../consultationVideoStageShared'
import { doctorConsultationCardClass } from './doctorConsultationUi'

type DoctorConsultationDemoVideoStageProps = {
  patientName: string
  patientCpfMasked: string
  patientAgeGender: string
  patientVideoPosterUrl: string
  doctorPhotoUrl: string
  onViewClinicalTriage?: () => void
  onViewPreviousConsultations?: () => void
  className?: string
}

export function DoctorConsultationDemoVideoStage({
  patientName,
  patientCpfMasked,
  patientAgeGender,
  patientVideoPosterUrl,
  doctorPhotoUrl,
  onViewClinicalTriage,
  onViewPreviousConsultations,
  className,
}: DoctorConsultationDemoVideoStageProps) {
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)

  return (
    <section
      className={[doctorConsultationCardClass, 'h-full min-h-0 p-0', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl bg-gray-900">
        <img
          src={patientVideoPosterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        <div
          className="absolute left-4 top-4 z-10 flex h-9 items-center gap-1.5 rounded-lg bg-black/35 px-2 text-white backdrop-blur-sm"
          title="Ao vivo"
        >
          <ConnectionSignalIcon state="connected" hasRemoteVideo videoEnabled />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
            Ao vivo
          </span>
        </div>

        <ConsultationVideoMediaControls
          connectionState="connected"
          isMicEnabled={isMicEnabled}
          isCameraEnabled={isCameraEnabled}
          onToggleMic={() => setIsMicEnabled((current) => !current)}
          onToggleCamera={() => setIsCameraEnabled((current) => !current)}
        />

        <div className="absolute bottom-4 left-4 z-10 flex max-w-[min(calc(100%-2rem),280px)] flex-col items-start gap-2">
          <div className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-white shadow-lg backdrop-blur-md">
            <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
              {patientName}
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
            </p>
            <p className="mt-1 text-xs text-white/90">CPF {patientCpfMasked}</p>
            <p className="mt-0.5 text-xs text-white/75">{patientAgeGender}</p>
          </div>

          {onViewClinicalTriage ? (
            <button
              type="button"
              onClick={onViewClinicalTriage}
              className="btn-video-triage-gradient inline-flex w-full items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-xs font-semibold shadow-lg sm:text-sm"
            >
              <Stethoscope className="h-4 w-4 shrink-0 text-white" strokeWidth={2} />
              Ver triagem clínica
            </button>
          ) : null}

          {onViewPreviousConsultations ? (
            <button
              type="button"
              onClick={onViewPreviousConsultations}
              className="btn-video-historico-gradient inline-flex w-full items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-xs font-semibold shadow-lg sm:text-sm"
            >
              <History className="h-4 w-4 shrink-0 text-white" strokeWidth={2} />
              Consultas anteriores
            </button>
          ) : null}
        </div>

        <div className="absolute right-4 top-4 h-[88px] w-[120px] overflow-hidden rounded-xl border-2 border-white/90 bg-gray-950 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[96px] sm:w-[132px]">
          <img
            src={doctorPhotoUrl}
            alt=""
            className={[
              'h-full w-full object-cover',
              isCameraEnabled ? 'opacity-100' : 'opacity-35',
            ].join(' ')}
          />

          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {isMicEnabled ? (
              <Mic className="h-3 w-3 text-emerald-300" strokeWidth={2.5} />
            ) : (
              <MicOff className="h-3 w-3 text-red-300" strokeWidth={2.5} />
            )}
            Você
          </div>
        </div>
      </div>
    </section>
  )
}
