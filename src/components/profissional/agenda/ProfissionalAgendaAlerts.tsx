import { AlertTriangle, RefreshCw, Shield } from 'lucide-react'
import type { ProfissionalAgendaNotice } from '../../../types/profissionalAgenda'
import { profissionalAgendaPanelClass } from './profissionalAgendaUi'

const noticeIcon = {
  troca: RefreshCw,
  cancelamento: AlertTriangle,
  reserva: Shield,
} as const

const noticeTone = {
  troca: 'border-sky-100 bg-sky-50/80 text-sky-900',
  cancelamento: 'border-red-100 bg-red-50/70 text-red-900',
  reserva: 'border-violet-100 bg-violet-50/70 text-violet-900',
} as const

type ProfissionalAgendaAlertsProps = {
  notices: ProfissionalAgendaNotice[]
}

export function ProfissionalAgendaAlerts({ notices }: ProfissionalAgendaAlertsProps) {
  if (notices.length === 0) return null

  return (
    <section className={[profissionalAgendaPanelClass, 'p-4 sm:p-5'].join(' ')}>
      <h2 className="text-sm font-bold text-gray-900">Avisos da escala</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {notices.map((notice) => {
          const Icon = noticeIcon[notice.type]
          return (
            <li
              key={notice.id}
              className={[
                'flex gap-3 rounded-xl border px-3.5 py-3',
                noticeTone[notice.type],
              ].join(' ')}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{notice.title}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{notice.body}</p>
                <p className="mt-1.5 text-[11px] font-medium opacity-70">{notice.dateLabel}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
