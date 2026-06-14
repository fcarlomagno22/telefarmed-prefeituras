type PatientConsultationHeaderProps = {
  elapsed: string
  startedAtLabel: string
  datePill: string
  timePill: string
  onEndConsultation?: () => void
}

export function PatientConsultationHeader({
  elapsed,
  startedAtLabel,
  datePill,
  timePill,
  onEndConsultation,
}: PatientConsultationHeaderProps) {
  return (
    <header className="shrink-0 bg-white pb-3 pt-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px]">
              Consulta por vídeo / Teleatendimento
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Em atendimento
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold tabular-nums text-gray-800 shadow-sm">
                {elapsed}
              </span>
              <span className="text-xs text-gray-500">{startedAtLabel}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
              {datePill}
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium tabular-nums text-gray-700 shadow-sm">
              {timePill}
            </span>
            <button
              type="button"
              onClick={onEndConsultation}
              className="btn-danger-gradient rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Encerrar Consulta
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
