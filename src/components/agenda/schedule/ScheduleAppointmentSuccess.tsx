import { CalendarCheck, CheckCircle2 } from 'lucide-react'
import { formatAgendaDayLabel } from '../../../utils/agendaDate'
import type { ScheduleAppointmentDraft } from './scheduleAppointmentTypes'

type ScheduleAppointmentSuccessProps = {
  draft: ScheduleAppointmentDraft
  onClose: () => void
}

export function ScheduleAppointmentSuccess({ draft, onClose }: ScheduleAppointmentSuccessProps) {
  const doctorName = draft.selectedDoctorName?.trim()

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 shadow-[0_8px_32px_rgba(16,185,129,0.2)] ring-1 ring-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" strokeWidth={2} />
      </span>

      <h3 className="mt-6 text-xl font-bold text-gray-900">Consulta agendada!</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
        O agendamento de <strong className="text-gray-800">{draft.registration.fullName}</strong>{' '}
        foi registrado com sucesso na agenda.
      </p>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/40 to-white p-5 text-left shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <CalendarCheck className="h-5 w-5 text-[var(--brand-primary)]" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              Detalhes
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{draft.specialtyName}</p>
            <p className="mt-2 text-sm text-gray-600">
              {formatAgendaDayLabel(draft.selectedDate)} às{' '}
              <span className="font-semibold tabular-nums text-gray-900">
                {draft.selectedTime}
              </span>
            </p>
            {doctorName ? (
              <p className="mt-1 text-sm text-gray-500">com {doctorName}</p>
            ) : null}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-8 rounded-xl bg-[var(--brand-primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
      >
        Fechar
      </button>
    </div>
  )
}
