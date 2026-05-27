import { BadgeCheck, Signal } from 'lucide-react'
import { patientConsultationCardClass } from './patientConsultationUi'

type PatientConsultationVideoStageProps = {
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorVideoPosterUrl: string
  patientPhotoUrl: string
  className?: string
}

export function PatientConsultationVideoStage({
  doctorName,
  doctorSpecialty,
  doctorCrm,
  doctorVideoPosterUrl,
  patientPhotoUrl,
  className,
}: PatientConsultationVideoStageProps) {
  return (
    <section
      className={[patientConsultationCardClass, 'h-full min-h-0 p-0', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl bg-gray-900">
        <img
          src={doctorVideoPosterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/35 text-white backdrop-blur-sm">
          <Signal className="h-4 w-4" strokeWidth={2} />
        </div>

        <div className="absolute bottom-4 left-4 max-w-[min(calc(100%-2rem),320px)] rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-white shadow-lg backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
            {doctorName}
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
          </p>
          <p className="mt-0.5 text-xs text-white/85">
            {doctorSpecialty} • CRM {doctorCrm}
          </p>
        </div>

        <div className="absolute bottom-4 right-4 h-[108px] w-[152px] overflow-hidden rounded-xl border-2 border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[120px] sm:w-[168px]">
          <img src={patientPhotoUrl} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  )
}
