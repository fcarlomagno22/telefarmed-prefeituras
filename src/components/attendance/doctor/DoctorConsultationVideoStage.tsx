import { BadgeCheck, Signal } from 'lucide-react'
import { doctorConsultationCardClass } from './doctorConsultationUi'

type DoctorConsultationVideoStageProps = {
  patientName: string
  patientCpfMasked: string
  patientAgeGender: string
  patientVideoPosterUrl: string
  doctorPhotoUrl: string
  className?: string
}

export function DoctorConsultationVideoStage({
  patientName,
  patientCpfMasked,
  patientAgeGender,
  patientVideoPosterUrl,
  doctorPhotoUrl,
  className,
}: DoctorConsultationVideoStageProps) {
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

        <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/35 text-white backdrop-blur-sm">
          <Signal className="h-4 w-4" strokeWidth={2} />
        </div>

        <div className="absolute right-4 top-4 h-[88px] w-[120px] overflow-hidden rounded-xl border-2 border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[96px] sm:w-[132px]">
          <img src={doctorPhotoUrl} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="absolute bottom-4 left-4 z-10 max-w-[min(calc(100%-2rem),280px)] rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-white shadow-lg backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
            {patientName}
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
          </p>
          <p className="mt-1 text-xs text-white/90">CPF {patientCpfMasked}</p>
          <p className="mt-0.5 text-xs text-white/75">{patientAgeGender}</p>
        </div>
      </div>
    </section>
  )
}
