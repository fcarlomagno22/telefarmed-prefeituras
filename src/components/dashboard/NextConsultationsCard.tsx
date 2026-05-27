import { Calendar } from 'lucide-react'
import { nextConsultations } from '../../data/dashboardMock'

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
}

export function NextConsultationsCard() {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Próximas Consultas</h2>
        <a
          href="#"
          className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
        >
          Ver agenda
        </a>
      </header>

      <ul className="mt-4 flex-1 space-y-2.5">
        {nextConsultations.map((item) => {
          const status = consultationStatus[item.status]
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-50 px-3 py-2.5"
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
                <span className="mt-0.5 block text-xs text-gray-500">
                  {item.specialty}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
      >
        <Calendar className="h-4 w-4" strokeWidth={2} />
        Ver agenda completa
      </button>
    </section>
  )
}
