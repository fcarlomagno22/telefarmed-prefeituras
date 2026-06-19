import { RotateCcw, Search } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { FLOATING_POPOVER_Z_INDEX } from '../../config/overlayLayers'
import type { ConsultasFilters } from '../../utils/consultasFilters'
import { CompactDateRangePicker } from '../ui/CompactDateRangePicker'
import { CustomSelect } from '../ui/CustomSelect'
import { FloatingOverlayPortal } from '../ui/FloatingOverlayPortal'

export const CONSULTAS_FILTERS_TRIGGER_ID = 'consultas-filters-trigger'

const PANEL_VIEWPORT_MARGIN = 16
const PANEL_MAX_WIDTH = 920

const selectClass = 'py-2 text-xs rounded-lg focus:ring-1 focus:ring-[var(--brand-primary)]/20'

type FilterOption = { value: string; label: string }

type ConsultasFiltersMegamenuProps = {
  open: boolean
  filters: ConsultasFilters
  unitLabel: string
  filterOptions: {
    specialties: FilterOption[]
    doctors: FilterOption[]
    neighborhoods: FilterOption[]
    genders: FilterOption[]
    ageRanges: FilterOption[]
    statuses: FilterOption[]
  }
  onChange: (filters: ConsultasFilters) => void
  onApply: () => void
  onCancel: () => void
  onClear: () => void
}

function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  )
}

function CompactField({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
      {children}
    </label>
  )
}

function FilterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-0 lg:px-3">
      <GroupTitle>{title}</GroupTitle>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function ConsultasFiltersMegamenu({
  open,
  filters,
  unitLabel,
  filterOptions,
  onChange,
  onApply,
  onCancel,
  onClear,
}: ConsultasFiltersMegamenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(filters)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null)
      return
    }

    function updatePosition() {
      const trigger = document.getElementById(CONSULTAS_FILTERS_TRIGGER_ID)
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - PANEL_VIEWPORT_MARGIN * 2)
      const left = Math.min(
        Math.max(PANEL_VIEWPORT_MARGIN, rect.right - width),
        window.innerWidth - width - PANEL_VIEWPORT_MARGIN,
      )
      const maxHeight = Math.max(240, window.innerHeight - rect.bottom - PANEL_VIEWPORT_MARGIN)

      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width,
        maxHeight,
        zIndex: FLOATING_POPOVER_Z_INDEX - 1,
        pointerEvents: 'auto',
      })
      return true
    }

    if (!updatePosition()) {
      const frame = requestAnimationFrame(() => updatePosition())
      return () => cancelAnimationFrame(frame)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  function patch<K extends keyof ConsultasFilters>(key: K, value: ConsultasFilters[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleApply() {
    onChange(draft)
    onApply()
  }

  function handleClear() {
    onClear()
  }

  if (!open || !panelStyle) return null

  return (
    <FloatingOverlayPortal>
      <div
        ref={panelRef}
        id="consultas-filters-megamenu"
        role="region"
        aria-label="Filtros de busca de consultas"
        style={panelStyle}
        className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border-2 border-[var(--brand-primary)] bg-white shadow-[var(--brand-primary-shadow-sm)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-gray-100">
            <FilterColumn title="Período">
              <CompactField label="Período de atendimento" className="col-span-1 sm:col-span-2">
                <CompactDateRangePicker
                  start={draft.periodStart}
                  end={draft.periodEnd}
                  onStartChange={(value) => patch('periodStart', value)}
                  onEndChange={(value) => patch('periodEnd', value)}
                />
              </CompactField>
            </FilterColumn>

            <FilterColumn title="Atendimento">
              <CompactField label="Especialidade" className="col-span-1 sm:col-span-2">
                <CustomSelect
                  value={draft.specialty}
                  onChange={(value) => patch('specialty', value)}
                  options={[...filterOptions.specialties]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Médico">
                <CustomSelect
                  value={draft.doctor}
                  onChange={(value) => patch('doctor', value)}
                  options={[...filterOptions.doctors]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Bairro">
                <CustomSelect
                  value={draft.neighborhood}
                  onChange={(value) => patch('neighborhood', value)}
                  options={[...filterOptions.neighborhoods]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Unidade de atendimento" className="col-span-1 sm:col-span-2">
                <p className="flex min-h-[2.125rem] items-center rounded-lg border border-gray-100 bg-gray-50 px-2.5 text-xs font-medium text-gray-700">
                  {unitLabel}
                </p>
              </CompactField>
            </FilterColumn>

            <FilterColumn title="Paciente e status">
              <CompactField label="Sexo">
                <CustomSelect
                  value={draft.gender}
                  onChange={(value) => patch('gender', value)}
                  options={[...filterOptions.genders]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Faixa etária">
                <CustomSelect
                  value={draft.ageRange}
                  onChange={(value) => patch('ageRange', value)}
                  options={[...filterOptions.ageRanges]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Status da consulta" className="col-span-1 sm:col-span-2">
                <CustomSelect
                  value={draft.status}
                  onChange={(value) => patch('status', value)}
                  options={[...filterOptions.statuses]}
                  className={selectClass}
                />
              </CompactField>
            </FilterColumn>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-gray-50/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            Limpar filtros
          </button>

          <div className="flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--brand-primary-shadow-sm)] transition hover:bg-[var(--brand-primary-hover)] sm:flex-none"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={2} />
              Aplicar filtros
            </button>
          </div>
        </footer>
      </div>
    </FloatingOverlayPortal>
  )
}
