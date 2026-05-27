import { Building2, Calendar } from 'lucide-react'
import type { AttendanceSession } from '../../../data/attendanceSession'
import { patientConsultationCardClass } from './patientConsultationUi'

type PatientConsultationInfoSectionProps = {
  session: AttendanceSession
  className?: string
}

function formatUnitDisplay(unitName: string) {
  if (/sala de teleatendimento/i.test(unitName)) return unitName
  return `${unitName} — Sala de Teleatendimento`
}

export function PatientConsultationInfoSection({
  session,
  className,
}: PatientConsultationInfoSectionProps) {
  const professionalName = session.doctorName?.trim() || 'A definir'
  const unitDisplay = formatUnitDisplay(session.unitName)

  return (
    <section
      className={[patientConsultationCardClass, 'h-full min-h-0', className].filter(Boolean).join(' ')}
    >
      <div className="shrink-0 border-b border-gray-100 px-3 py-2.5 sm:px-4">
        <h2 className="text-sm font-bold text-gray-900">Informações da consulta</h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          <InfoColumn title="Profissional">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <img
                src={session.doctorPhotoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white sm:h-14 sm:w-14"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight text-gray-900 sm:text-lg">
                  {professionalName}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">CRM {session.doctorCrm}</p>
              </div>
            </div>
          </InfoColumn>

          <InfoColumn title="Paciente">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <img
                src={session.patientPhotoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white sm:h-14 sm:w-14"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight text-gray-900 sm:text-lg">
                  {session.patientName}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">CPF {session.patientCpfMasked}</p>
              </div>
            </div>
          </InfoColumn>

          <InfoColumn title="Data e hora">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 sm:h-14 sm:w-14">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-base font-bold leading-tight text-gray-900 sm:text-lg">
                  {session.appointmentDateLabel}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">{session.appointmentTimeLabel}</p>
              </div>
            </div>
          </InfoColumn>
        </div>

        <div className="border-t border-gray-100 pt-3 sm:pt-3.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Convênio / Unidade
          </p>
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium leading-snug text-gray-800">{unitDisplay}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{session.insuranceLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  )
}
