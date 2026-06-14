import { Calendar, Megaphone } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ubtRoutes } from '../../config/ubtRoutes'
import type { UbtDashboardConsultaHoje } from '../../types/ubtDashboard'

const consultationStatus = {
  waiting: {
    label: 'Aguardando',
    className:
      'border-[var(--brand-primary)]/40 bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
  },
  confirmed: {
    label: 'Confirmada',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  in_progress: {
    label: 'Em atendimento',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  completed: {
    label: 'Concluída',
    className: 'border-gray-200 bg-gray-50 text-gray-600',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'border-red-200 bg-red-50 text-red-600',
  },
}

type NextConsultationsCardProps = {
  consultations: UbtDashboardConsultaHoje[]
  isLoading?: boolean
  onCallConsultation?: (consultation: UbtDashboardConsultaHoje) => void
  callDisabled?: boolean
  isCalling?: boolean
  callError?: string | null
}

export function NextConsultationsCard({
  consultations,
  isLoading,
  onCallConsultation,
  callDisabled = false,
  isCalling = false,
  callError = null,
}: NextConsultationsCardProps) {
  const waitingConsultations = useMemo(
    () => consultations.filter((item) => item.status === 'waiting'),
    [consultations],
  )

  if (isLoading) {
    return (
      <section className="flex h-full min-h-[220px] animate-pulse flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5" />
    )
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Próximas Consultas</h2>
        <Link
          to={ubtRoutes.agenda}
          className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
        >
          Ver agenda
        </Link>
      </header>

      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
        Apenas pacientes com situação <strong className="font-semibold text-gray-700">Aguardando</strong>{' '}
        na agenda de hoje — prontos para chamada no Terminal.
      </p>

      {callError ? (
        <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {callError}
        </p>
      ) : null}

      <ul className="mt-3 flex-1 space-y-2.5">
        {waitingConsultations.length === 0 ? (
          <li className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
            Nenhum paciente aguardando atendimento no momento.
          </li>
        ) : (
          waitingConsultations.map((item) => {
            const status = consultationStatus.waiting
            const canCall = Boolean(onCallConsultation)

            return (
              <li
                key={item.id}
                className={[
                  'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5',
                  canCall
                    ? 'border-[var(--brand-primary)]/20 bg-[var(--brand-primary-light)]/25'
                    : 'border-gray-50',
                ].join(' ')}
              >
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-[var(--brand-primary)]">
                      {item.time}
                    </span>
                    <span className="truncate text-sm font-medium text-gray-900">
                      {item.patient}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{item.specialty}</span>
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${status.className}`}
                  >
                    {item.statusLabel}
                  </span>
                  {canCall ? (
                    <button
                      type="button"
                      onClick={() => onCallConsultation?.(item)}
                      disabled={callDisabled || isCalling}
                      title={
                        callDisabled
                          ? 'Finalize o atendimento no Terminal antes de chamar outro paciente'
                          : 'Chamar e iniciar triagem'
                      }
                      aria-label={`Chamar ${item.patient}`}
                      className={[
                        'inline-flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition',
                        callDisabled || isCalling
                          ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                          : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
                      ].join(' ')}
                    >
                      <Megaphone className="h-4 w-4" strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })
        )}
      </ul>

      <Link
        to={ubtRoutes.agenda}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
      >
        <Calendar className="h-4 w-4" strokeWidth={2} />
        Ver agenda completa
      </Link>
    </section>
  )
}
