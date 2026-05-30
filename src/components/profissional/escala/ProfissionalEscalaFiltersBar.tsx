import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import type { ProfissionalEscalaFilters } from '../../../types/profissionalEscalaDisponivel'
import { profissionalEscalaSpecialtyOptions } from '../../../data/profissionalEscalaDisponivelMock'
import { formatBrlCurrencyInput } from '../../../utils/formatBrlCurrency'
import { CustomSelect } from '../../ui/CustomSelect'
import { profissionalEscalaPanelClass } from './profissionalEscalaUi'

const turnOptions = [
  { value: 'all', label: 'Todos os turnos' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
]

const modalityOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'tele', label: 'Telemedicina' },
  { value: 'presencial', label: 'Presencial' },
]

/** Mesma altura visual do `CustomSelect` (size default: py-3 px-4). */
const filterControlLikeSelectClass = [
  'w-full min-w-0 rounded-xl border border-gray-200/80 bg-white text-sm text-gray-800 outline-none transition',
  'focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15',
].join(' ')

const dateInputClass = [filterControlLikeSelectClass, 'px-3 py-3'].join(' ')
const amountInputClass = [filterControlLikeSelectClass, 'px-4 py-3'].join(' ')

type ProfissionalEscalaFiltersBarProps = {
  draft: ProfissionalEscalaFilters
  onDraftChange: (next: ProfissionalEscalaFilters) => void
  onSearch: () => void
  onClear: () => void
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  )
}

export function ProfissionalEscalaFiltersBar({
  draft,
  onDraftChange,
  onSearch,
  onClear,
}: ProfissionalEscalaFiltersBarProps) {
  const patch = (partial: Partial<ProfissionalEscalaFilters>) =>
    onDraftChange({ ...draft, ...partial })

  return (
    <section
      data-tour="escala-filters"
      className={[profissionalEscalaPanelClass, 'shrink-0 p-4 sm:p-5'].join(' ')}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FilterField label="Especialidade">
          <CustomSelect
            value={draft.specialty}
            onChange={(value) => patch({ specialty: value })}
            options={profissionalEscalaSpecialtyOptions}
          />
        </FilterField>

        <FilterField label="Período">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={draft.dateFrom}
              onChange={(event) => patch({ dateFrom: event.target.value })}
              className={dateInputClass}
              aria-label="Data inicial"
            />
            <span className="shrink-0 text-xs font-medium text-gray-400">até</span>
            <input
              type="date"
              value={draft.dateTo}
              min={draft.dateFrom || undefined}
              onChange={(event) => patch({ dateTo: event.target.value })}
              className={dateInputClass}
              aria-label="Data final"
            />
          </div>
        </FilterField>

        <FilterField label="Turno">
          <CustomSelect
            value={draft.turn}
            onChange={(value) => patch({ turn: value as ProfissionalEscalaFilters['turn'] })}
            options={turnOptions}
          />
        </FilterField>

        <FilterField label="Modalidade">
          <CustomSelect
            value={draft.modality}
            onChange={(value) => patch({ modality: value as ProfissionalEscalaFilters['modality'] })}
            options={modalityOptions}
          />
        </FilterField>

        <div className="col-span-1 flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-end sm:justify-between lg:col-span-3 xl:col-span-5">
          <FilterField label="Faixa de valor (R$)">
            <div className="flex items-stretch gap-2 sm:max-w-xs lg:max-w-sm">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Mín."
                value={draft.minAmountReais}
                onChange={(event) =>
                  patch({ minAmountReais: formatBrlCurrencyInput(event.target.value) })
                }
                className={[amountInputClass, 'min-w-0 flex-1'].join(' ')}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Máx."
                value={draft.maxAmountReais}
                onChange={(event) =>
                  patch({ maxAmountReais: formatBrlCurrencyInput(event.target.value) })
                }
                className={[amountInputClass, 'min-w-0 flex-1'].join(' ')}
              />
            </div>
          </FilterField>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:pb-0.5">
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Limpar filtros
            </button>
            <button
              type="button"
              data-tour="escala-search-btn"
              onClick={onSearch}
              className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <Search className="h-4 w-4" strokeWidth={2.25} />
              Buscar plantões
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
