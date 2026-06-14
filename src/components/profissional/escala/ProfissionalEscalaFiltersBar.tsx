import { Filter, Search } from 'lucide-react'
import { profissionalEscalaPanelClass } from './profissionalEscalaUi'
import { PROFISSIONAL_ESCALA_FILTERS_TRIGGER_ID } from './ProfissionalEscalaFiltersMegamenu'

type ProfissionalEscalaFiltersBarProps = {
  filtersOpen: boolean
  activeFilterCount: number
  onToggleFilters: () => void
  onSearch: () => void
}

export function ProfissionalEscalaFiltersBar({
  filtersOpen,
  activeFilterCount,
  onToggleFilters,
  onSearch,
}: ProfissionalEscalaFiltersBarProps) {
  return (
    <section
      data-tour="escala-filters"
      className={[profissionalEscalaPanelClass, 'shrink-0 p-4 sm:p-5'].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Buscar plantões</h2>
          <p className="text-xs text-gray-500">
            Filtre por especialidade, período, turno, modalidade e valor
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            id={PROFISSIONAL_ESCALA_FILTERS_TRIGGER_ID}
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="profissional-escala-filters-megamenu"
            onClick={onToggleFilters}
            className={[
              'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition',
              filtersOpen || activeFilterCount > 0
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            <Filter className="h-4 w-4 shrink-0" strokeWidth={2} />
            Filtrar
            {activeFilterCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-bold text-white tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            data-tour="escala-search-btn"
            onClick={onSearch}
            className="btn-brand-gradient inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
          >
            <Search className="h-4 w-4" strokeWidth={2.25} />
            Buscar plantões
          </button>
        </div>
      </div>
    </section>
  )
}
