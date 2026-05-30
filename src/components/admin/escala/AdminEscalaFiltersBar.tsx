import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { adminEscalaSpecialtyFilterOptions } from '../../../data/adminEscalaMock'
import { formatBrlCurrencyInput } from '../../../utils/formatBrlCurrency'
import type { AdminEscalaOpenFilters } from '../../../utils/escala/filterAdminEscalaOpenShifts'
import { CustomSelect } from '../../ui/CustomSelect'
import { profissionalEscalaPanelClass } from '../../profissional/escala/profissionalEscalaUi'

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
  { value: 'hibrido', label: 'Híbrido' },
]

const assignmentOptions = [
  { value: 'all', label: 'Todos os modos' },
  { value: 'open', label: 'Aberto (marketplace)' },
  { value: 'assigned', label: 'Médico definido' },
]

const fillOptions = [
  { value: 'all', label: 'Preenchimento: todos' },
  { value: 'aberto', label: 'Aberto' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'lotado', label: 'Lotado' },
]

const statusOptions = [
  { value: 'all', label: 'Status: todos' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'cancelada', label: 'Cancelada' },
]

const filterControlClass = [
  'w-full min-w-0 rounded-xl border border-gray-200/80 bg-white text-sm text-gray-800 outline-none transition',
  'focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15',
  'px-3 py-3',
].join(' ')

type AdminEscalaFiltersBarProps = {
  draft: AdminEscalaOpenFilters
  onDraftChange: (next: AdminEscalaOpenFilters) => void
  onSearch: () => void
  onClear: () => void
  trailing?: ReactNode
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

export function AdminEscalaFiltersBar({
  draft,
  onDraftChange,
  onSearch,
  onClear,
  trailing,
}: AdminEscalaFiltersBarProps) {
  const patch = (partial: Partial<AdminEscalaOpenFilters>) =>
    onDraftChange({ ...draft, ...partial })

  return (
    <section className={[profissionalEscalaPanelClass, 'shrink-0 p-4 sm:p-5'].join(' ')}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Buscar plantões</h2>
          <p className="text-xs text-gray-500">Filtros alinhados ao portal do profissional</p>
        </div>
        {trailing}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Busca">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={draft.search}
                onChange={(e) => patch({ search: e.target.value })}
                placeholder="Especialidade, UBT, cidade…"
                className={[filterControlClass, 'pl-9'].join(' ')}
              />
            </div>
          </FilterField>

          <FilterField label="Especialidade">
            <CustomSelect
              value={draft.specialty}
              onChange={(value) => patch({ specialty: value })}
              options={adminEscalaSpecialtyFilterOptions}
            />
          </FilterField>

          <FilterField label="Período">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draft.dateFrom}
                onChange={(e) => patch({ dateFrom: e.target.value })}
                className={filterControlClass}
                aria-label="Data inicial"
              />
              <span className="shrink-0 text-xs text-gray-400">até</span>
              <input
                type="date"
                value={draft.dateTo}
                min={draft.dateFrom || undefined}
                onChange={(e) => patch({ dateTo: e.target.value })}
                className={filterControlClass}
                aria-label="Data final"
              />
            </div>
          </FilterField>

          <FilterField label="Turno">
            <CustomSelect
              value={draft.turn}
              onChange={(value) => patch({ turn: value as AdminEscalaOpenFilters['turn'] })}
              options={turnOptions}
            />
          </FilterField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <FilterField label="Modalidade">
            <CustomSelect
              value={draft.modality}
              onChange={(value) => patch({ modality: value as AdminEscalaOpenFilters['modality'] })}
              options={modalityOptions}
            />
          </FilterField>

          <FilterField label="Modo">
            <CustomSelect
              value={draft.assignmentMode}
              onChange={(value) =>
                patch({ assignmentMode: value as AdminEscalaOpenFilters['assignmentMode'] })
              }
              options={assignmentOptions}
            />
          </FilterField>

          <FilterField label="Status">
            <CustomSelect
              value={draft.status}
              onChange={(value) => patch({ status: value as AdminEscalaOpenFilters['status'] })}
              options={statusOptions}
            />
          </FilterField>

          <FilterField label="Preenchimento">
            <CustomSelect
              value={draft.fillStatus}
              onChange={(value) =>
                patch({ fillStatus: value as AdminEscalaOpenFilters['fillStatus'] })
              }
              options={fillOptions}
            />
          </FilterField>

          <FilterField label="Faixa de valor (R$)">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Mín."
                value={draft.minAmountReais}
                onChange={(e) =>
                  patch({ minAmountReais: formatBrlCurrencyInput(e.target.value) })
                }
                className={filterControlClass}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Máx."
                value={draft.maxAmountReais}
                onChange={(e) =>
                  patch({ maxAmountReais: formatBrlCurrencyInput(e.target.value) })
                }
                className={filterControlClass}
              />
            </div>
          </FilterField>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Limpar filtros
        </button>
        <button
          type="button"
          onClick={onSearch}
          className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </div>
    </section>
  )
}
