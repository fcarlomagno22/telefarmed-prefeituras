import { Clock3, ListOrdered, Stethoscope, Users } from 'lucide-react'
import type { ProfissionalShiftStats } from '../../../types/profissionalAgenda'
import { profissionalAgendaPanelClass } from './profissionalAgendaUi'

type ProfissionalAgendaKpiRowProps = {
  stats: ProfissionalShiftStats
}

const cards = [
  { key: 'previstos' as const, label: 'Previstos', icon: Users },
  { key: 'naFila' as const, label: 'Na fila', icon: ListOrdered },
  { key: 'atendidos' as const, label: 'Atendidos', icon: Stethoscope },
  { key: 'tempoMedioMin' as const, label: 'Tempo médio', icon: Clock3 },
]

export function ProfissionalAgendaKpiRow({ stats }: ProfissionalAgendaKpiRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon }) => {
        const value =
          key === 'tempoMedioMin'
            ? stats.tempoMedioMin > 0
              ? `${stats.tempoMedioMin} min`
              : '—'
            : String(stats[key])

        return (
          <div
            key={key}
            className={[profissionalAgendaPanelClass, 'flex items-center gap-3 px-4 py-3.5'].join(
              ' ',
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </span>
              <span className="mt-0.5 block text-lg font-bold tabular-nums text-gray-900">
                {value}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
