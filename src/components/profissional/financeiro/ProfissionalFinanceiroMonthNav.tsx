import { ChevronLeft, ChevronRight } from 'lucide-react'

type ProfissionalFinanceiroMonthNavProps = {
  label: string
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

export function ProfissionalFinanceiroMonthNav({
  label,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: ProfissionalFinanceiroMonthNavProps) {
  return (
    <div className="flex items-center justify-between gap-3" data-tour="financeiro-month-nav">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <p className="min-w-0 flex-1 text-center text-sm font-bold text-gray-900">{label}</p>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
