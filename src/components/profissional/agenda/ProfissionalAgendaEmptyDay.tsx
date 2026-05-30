import { CalendarX2 } from 'lucide-react'
import { profissionalAgendaPanelClass } from './profissionalAgendaUi'

type ProfissionalAgendaEmptyDayProps = {
  dateLabel: string
}

export function ProfissionalAgendaEmptyDay({ dateLabel }: ProfissionalAgendaEmptyDayProps) {
  return (
    <section
      className={[
        profissionalAgendaPanelClass,
        'flex flex-col items-center justify-center px-6 py-10 text-center',
      ].join(' ')}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 ring-1 ring-gray-100">
        <CalendarX2 className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-base font-semibold text-gray-900">
        Você não tem plantão neste dia
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
        Não há designação na escala para {dateLabel}. Selecione outro dia com indicador
        laranja ou aguarde novas publicações da operação.
      </p>
    </section>
  )
}
