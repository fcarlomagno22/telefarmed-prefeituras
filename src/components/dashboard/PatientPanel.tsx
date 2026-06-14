import { CheckCircle2, UserRound, Video, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RegisteredPatient } from '../../types/attendance'

type PatientPanelProps = {
  patient: RegisteredPatient
  hint: string
  primaryAction: {
    label: string
    onClick: () => void
  }
  secondaryAction: {
    label: string
    onClick: () => void
    variant?: 'finish' | 'cancel'
  }
}

export function PatientPanel({
  patient,
  hint,
  primaryAction,
  secondaryAction,
}: PatientPanelProps) {
  const isFinish = secondaryAction.variant === 'finish'

  return (
    <article className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-gray-50/80 p-5 sm:p-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
          <UserRound className="h-7 w-7 text-[var(--brand-primary)]" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-gray-500">
            Paciente em atendimento
          </span>
          <span className="mt-0.5 block text-lg font-bold text-gray-900">
            {patient.name}
          </span>
          <span className="block text-sm text-gray-600">{patient.document}</span>
          <span className="mt-2 flex flex-wrap gap-2">
            <Tag>{patient.specialty}</Tag>
            <Tag>Protocolo {patient.protocol}</Tag>
            <Tag>Horário {patient.scheduledAt}</Tag>
          </span>
        </span>
      </header>

      <p className="mt-4 text-sm text-gray-600">{hint}</p>

      <footer className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
        >
          <Video className="h-4 w-4" strokeWidth={2} />
          {primaryAction.label}
        </button>
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className={
            isFinish
              ? 'inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100'
              : 'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50'
          }
        >
          {isFinish ? (
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          ) : (
            <XCircle className="h-4 w-4" strokeWidth={2} />
          )}
          {secondaryAction.label}
        </button>
      </footer>
    </article>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 ring-1 ring-gray-200">
      {children}
    </span>
  )
}
