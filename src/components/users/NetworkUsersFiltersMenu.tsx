import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { CustomSelect } from '../ui/CustomSelect'
import {
  countActiveNetworkUserFilters,
  type AgeGroupFilter,
  type GenderFilter,
  type IncompleteDataFilter,
  type LastAppointmentFilter,
  type NetworkUsersFilters,
  type NewUsersFilter,
  type SortOption,
  type TotalAppointmentsFilter,
} from '../../utils/networkUsersFilters'

type NetworkUsersFiltersMenuProps = {
  open: boolean
  filters: NetworkUsersFilters
  neighborhoods: string[]
  registrationUnits: string[]
  resultCount: number
  onClose: () => void
  onChange: (filters: NetworkUsersFilters) => void
  onClear: () => void
}

function FilterSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {description ? <p className="mt-1 text-[11px] leading-snug text-gray-500">{description}</p> : null}
      <div className="mt-2.5 space-y-2">{children}</div>
    </section>
  )
}

function RadioOption({
  name,
  checked,
  label,
  onChange,
}: {
  name: string
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition hover:bg-white">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
      />
      <span>{label}</span>
    </label>
  )
}

function CheckboxOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition hover:bg-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
      />
      <span>{label}</span>
    </label>
  )
}

function toggleListValue<T extends string>(list: T[], value: T, checked: boolean) {
  if (checked) return list.includes(value) ? list : [...list, value]
  return list.filter((item) => item !== value)
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Nome (A → Z)' },
  { value: 'name_desc', label: 'Nome (Z → A)' },
  { value: 'last_appointment_desc', label: 'Último atendimento (mais recente)' },
  { value: 'last_appointment_asc', label: 'Último atendimento (mais antigo)' },
  { value: 'total_appointments_desc', label: 'Total de atendimentos (maior)' },
  { value: 'total_appointments_asc', label: 'Total de atendimentos (menor)' },
]

export function NetworkUsersFiltersMenu({
  open,
  filters,
  neighborhoods,
  registrationUnits,
  resultCount,
  onClose,
  onChange,
  onClear,
}: NetworkUsersFiltersMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null)
      return
    }

    function updatePosition() {
      const trigger = document.getElementById('network-users-filter-trigger')
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(1120, window.innerWidth - 24)
      const left = Math.min(
        Math.max(12, rect.right - width),
        window.innerWidth - width - 12,
      )

      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width,
        maxHeight: `min(70vh, ${window.innerHeight - rect.bottom - 24}px)`,
        zIndex: 100,
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
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      const trigger = document.getElementById('network-users-filter-trigger')
      if (trigger?.contains(target)) return
      onClose()
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open || !panelStyle) return null

  const activeCount = countActiveNetworkUserFilters(filters)

  function patch(partial: Partial<NetworkUsersFilters>) {
    onChange({ ...filters, ...partial })
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filtros de usuários"
      style={panelStyle}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.14)]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gradient-to-r from-orange-50/80 to-white px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Filtros avançados</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {resultCount} paciente{resultCount === 1 ? '' : 's'} na lista
            {activeCount > 0 ? ` · ${activeCount} filtro${activeCount === 1 ? '' : 's'} ativo${activeCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          aria-label="Fechar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSection title="Bairro" description="Combine com o gráfico da lateral.">
            <div className="max-h-36 space-y-0.5 overflow-y-auto pr-1">
              {neighborhoods.map((neighborhood) => (
                <CheckboxOption
                  key={neighborhood}
                  label={neighborhood}
                  checked={filters.neighborhoods.includes(neighborhood)}
                  onChange={(checked) =>
                    patch({
                      neighborhoods: toggleListValue(filters.neighborhoods, neighborhood, checked),
                    })
                  }
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Faixa etária">
            {(
              [
                ['all', 'Todas'],
                ['0-17', '0–17 anos'],
                ['18-29', '18–29 anos'],
                ['30-59', '30–59 anos'],
                ['60+', '60+ anos'],
              ] as const
            ).map(([value, label]) => (
              <RadioOption
                key={value}
                name="age-group"
                label={label}
                checked={filters.ageGroup === value}
                onChange={() => patch({ ageGroup: value as AgeGroupFilter })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Gênero">
            {(
              [
                ['all', 'Todos'],
                ['Feminino', 'Feminino'],
                ['Masculino', 'Masculino'],
              ] as const
            ).map(([value, label]) => (
              <RadioOption
                key={value}
                name="gender"
                label={label}
                checked={filters.gender === value}
                onChange={() => patch({ gender: value as GenderFilter })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Último atendimento">
            {(
              [
                ['all', 'Qualquer período'],
                ['today', 'Hoje'],
                ['7d', 'Últimos 7 dias'],
                ['30d', 'Últimos 30 dias'],
                ['90d', 'Últimos 90 dias'],
                ['inactive', 'Sem atendimento há muito tempo'],
                ['never', 'Nunca atendido'],
              ] as const
            ).map(([value, label]) => (
              <RadioOption
                key={value}
                name="last-appointment"
                label={label}
                checked={filters.lastAppointment === value}
                onChange={() => patch({ lastAppointment: value as LastAppointmentFilter })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Total de atendimentos">
            {(
              [
                ['all', 'Todos'],
                ['inactive', 'Inativos (0)'],
                ['low', 'Pouco uso (1–5)'],
                ['frequent', 'Frequentes (6+)'],
              ] as const
            ).map(([value, label]) => (
              <RadioOption
                key={value}
                name="total-appointments"
                label={label}
                checked={filters.totalAppointments === value}
                onChange={() => patch({ totalAppointments: value as TotalAppointmentsFilter })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Usuários novos">
            {(
              [
                ['all', 'Todos'],
                ['this_month', 'Cadastrados neste mês'],
                ['30d', 'Últimos 30 dias'],
              ] as const
            ).map(([value, label]) => (
              <RadioOption
                key={value}
                name="new-users"
                label={label}
                checked={filters.newUsers === value}
                onChange={() => patch({ newUsers: value as NewUsersFilter })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Unidade de cadastro">
            <div className="max-h-36 space-y-0.5 overflow-y-auto pr-1">
              {registrationUnits.map((unit) => (
                <CheckboxOption
                  key={unit}
                  label={unit}
                  checked={filters.registrationUnits.includes(unit)}
                  onChange={(checked) =>
                    patch({
                      registrationUnits: toggleListValue(filters.registrationUnits, unit, checked),
                    })
                  }
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Dados incompletos" description="Pacientes com pendências no cadastro.">
            {(
              [
                ['no_phone', 'Sem telefone'],
                ['no_email', 'Sem e-mail'],
                ['no_emergency_contact', 'Sem contato de emergência'],
              ] as const
            ).map(([value, label]) => (
              <CheckboxOption
                key={value}
                label={label}
                checked={filters.incompleteData.includes(value)}
                onChange={(checked) =>
                  patch({
                    incompleteData: toggleListValue(
                      filters.incompleteData,
                      value as IncompleteDataFilter,
                      checked,
                    ),
                  })
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="Gestão">
            <CheckboxOption
              label="Com anotação ou alteração recente (7 dias)"
              checked={filters.recentActivityOnly}
              onChange={(checked) => patch({ recentActivityOnly: checked })}
            />
          </FilterSection>

          <FilterSection title="Ordenar por" description="Aplica-se à lista filtrada.">
            <CustomSelect
              value={filters.sortBy}
              onChange={(value) => patch({ sortBy: value as SortOption })}
              options={SORT_OPTIONS}
              className="py-2.5"
            />
          </FilterSection>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
        >
          Limpar filtros
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.3)] transition hover:bg-[var(--brand-primary-hover)]"
        >
          Ver {resultCount} resultado{resultCount === 1 ? '' : 's'}
        </button>
      </footer>
    </div>,
    document.body,
  )
}
