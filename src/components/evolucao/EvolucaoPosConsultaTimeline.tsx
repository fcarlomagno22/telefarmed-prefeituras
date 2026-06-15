import type { ProfissionalConsultaHistoricoCheckin } from '../../types/posConsultaHistorico'

const EVOLUCAO_LABELS = {
  melhorou: { label: 'Melhorou', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  igual: { label: 'Estável', className: 'bg-sky-50 text-sky-700 ring-sky-100' },
  piorou: { label: 'Piorou', className: 'bg-rose-50 text-rose-700 ring-rose-100' },
} as const

type EvolucaoPosConsultaTimelineProps = {
  checkins: ProfissionalConsultaHistoricoCheckin[]
  emptyMessage?: string
}

export function EvolucaoPosConsultaTimeline({
  checkins,
  emptyMessage = 'Nenhum check-in respondido neste acompanhamento.',
}: EvolucaoPosConsultaTimelineProps) {
  if (checkins.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ol className="relative space-y-0">
      {checkins.map((checkin, index) => {
        const evolucao = EVOLUCAO_LABELS[checkin.evolucaoComparacao]
        const isLast = index === checkins.length - 1

        return (
          <li key={checkin.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 bg-gray-200"
                aria-hidden
              />
            ) : null}
            <span
              className="relative z-[1] mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-bold text-white ring-4 ring-white"
              aria-hidden
            >
              {checkin.checkinNumber}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{checkin.respondedAtLabel}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Dia {checkin.planDayNumber} do plano</p>
                </div>
                <span
                  className={[
                    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                    evolucao.className,
                  ].join(' ')}
                >
                  {evolucao.label}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{checkin.summary}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
