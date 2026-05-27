import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  countActivePrefeituraMunicipalPatientFilters,
  type InactiveConsultationFilter,
  type PrefeituraMunicipalPatientsFilters,
} from '../../../utils/prefeituraMunicipalPatientsFilters'
import {
  type AgeGroupFilter,
  type GenderFilter,
  type IncompleteDataFilter,
  type LastAppointmentFilter,
  type NewUsersFilter,
  type SortOption,
  type TotalAppointmentsFilter,
} from '../../../utils/networkUsersFilters'

type PrefeituraUsuariosFiltersMenuProps = {
  open: boolean
  filters: PrefeituraMunicipalPatientsFilters
  neighborhoods: string[]
  firstAttendanceUnits: string[]
  resultCount: number
  onClose: () => void
  onChange: (filters: PrefeituraMunicipalPatientsFilters) => void
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
      {description ? (
        <p className="mt-1 text-[11px] leading-snug text-gray-500">{description}</p>
      ) : null}
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
  { value: 'last_appointment_desc', label: 'Última consulta (mais recente)' },
  { value: 'last_appointment_asc', label: 'Última consulta (mais antigo)' },
  { value: 'total_appointments_desc', label: 'Total de consultas (maior)' },
  { value: 'total_appointments_asc', label: 'Total de consultas (menor)' },
]

const INACTIVE_OPTIONS: { value: InactiveConsultationFilter; label: string }[] = [
  { value: 'all', label: 'Qualquer período' },
  { value: '6m', label: 'Sem consulta há 6+ meses' },
  { value: '12m', label: 'Sem consulta há 12+ meses' },
  { value: 'never', label: 'Nunca consultou' },
]

export function PrefeituraUsuariosFiltersMenu({
  open,
  filters,
  neighborhoods,
  firstAttendanceUnits,
  resultCount,
  onClose,
  onChange,
  onClear,
}: PrefeituraUsuariosFiltersMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null)
      return
    }

    function positionPanel() {
      const trigger = document.getElementById('prefeitura-usuarios-filter-trigger')
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const panelWidth = 360
      const left = Math.min(
        Math.max(12, rect.right - panelWidth),
        window.innerWidth - panelWidth - 12,
      )

      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: panelWidth,
        maxHeight: `min(70vh, ${window.innerHeight - rect.bottom - 24}px)`,
        zIndex: 100,
      })
      return true
    }

    if (!positionPanel()) {
      const frame = requestAnimationFrame(() => positionPanel())
      return () => cancelAnimationFrame(frame)
    }

    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)
    return () => {
      window.removeEventListener('resize', positionPanel)
      window.removeEventListener('scroll', positionPanel, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const trigger = document.getElementById('prefeitura-usuarios-filter-trigger')
      if (panelRef.current?.contains(target)) return
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

  function patch(partial: Partial<PrefeituraMunicipalPatientsFilters>) {
    onChange({ ...filters, ...partial })
  }

  const activeCount = countActivePrefeituraMunicipalPatientFilters(filters)

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filtros da base municipal"
      style={panelStyle}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Filtros municipais</h2>
          <p className="text-xs text-gray-500">
            {resultCount} paciente{resultCount === 1 ? '' : 's'} na seleção
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Fechar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 [-ms-overflow-style:none] [scrollbar-width:thin]">
        <FilterSection
          title="Campanhas de retorno"
          description="Pacientes elegíveis para reengajamento na rede."
        >
          {INACTIVE_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="inactive-consultation"
              checked={filters.inactiveConsultation === option.value}
              label={option.label}
              onChange={() => patch({ inactiveConsultation: option.value })}
            />
          ))}
        </FilterSection>

        <FilterSection title="Cadastro incompleto">
          <CheckboxOption
            checked={filters.incompleteData.includes('no_phone')}
            label="Sem telefone"
            onChange={(checked) =>
              patch({
                incompleteData: toggleListValue(
                  filters.incompleteData,
                  'no_phone',
                  checked,
                ) as IncompleteDataFilter[],
              })
            }
          />
          <CheckboxOption
            checked={filters.incompleteData.includes('no_email')}
            label="Sem e-mail"
            onChange={(checked) =>
              patch({
                incompleteData: toggleListValue(
                  filters.incompleteData,
                  'no_email',
                  checked,
                ) as IncompleteDataFilter[],
              })
            }
          />
          <CheckboxOption
            checked={filters.incompleteData.includes('no_emergency_contact')}
            label="Sem contato de emergência"
            onChange={(checked) =>
              patch({
                incompleteData: toggleListValue(
                  filters.incompleteData,
                  'no_emergency_contact',
                  checked,
                ) as IncompleteDataFilter[],
              })
            }
          />
        </FilterSection>

        <FilterSection title="Novos cadastros">
          {(
            [
              { value: 'all' as NewUsersFilter, label: 'Todos' },
              { value: 'this_month' as NewUsersFilter, label: 'Cadastrados este mês' },
              { value: '30d' as NewUsersFilter, label: 'Últimos 30 dias' },
            ] as const
          ).map((option) => (
            <RadioOption
              key={option.value}
              name="new-users"
              checked={filters.newUsers === option.value}
              label={option.label}
              onChange={() => patch({ newUsers: option.value })}
            />
          ))}
        </FilterSection>

        <FilterSection title="Última consulta">
          {(
            [
              { value: 'all' as LastAppointmentFilter, label: 'Qualquer data' },
              { value: 'today' as LastAppointmentFilter, label: 'Hoje' },
              { value: '7d' as LastAppointmentFilter, label: 'Últimos 7 dias' },
              { value: '30d' as LastAppointmentFilter, label: 'Últimos 30 dias' },
              { value: '90d' as LastAppointmentFilter, label: 'Últimos 90 dias' },
              { value: 'inactive' as LastAppointmentFilter, label: 'Inativo (90+ dias)' },
              { value: 'never' as LastAppointmentFilter, label: 'Nunca consultou' },
            ] as const
          ).map((option) => (
            <RadioOption
              key={option.value}
              name="last-appointment"
              checked={filters.lastAppointment === option.value}
              label={option.label}
              onChange={() => patch({ lastAppointment: option.value })}
            />
          ))}
        </FilterSection>

        {neighborhoods.length > 0 ? (
          <FilterSection title="Bairro de residência">
            {neighborhoods.map((neighborhood) => (
              <CheckboxOption
                key={neighborhood}
                checked={filters.neighborhoods.includes(neighborhood)}
                label={neighborhood}
                onChange={(checked) =>
                  patch({
                    neighborhoods: toggleListValue(filters.neighborhoods, neighborhood, checked),
                  })
                }
              />
            ))}
          </FilterSection>
        ) : null}

        {firstAttendanceUnits.length > 0 ? (
          <FilterSection
            title="Unidade de primeiro atendimento"
            description="Onde o paciente foi cadastrado pela primeira vez na rede."
          >
            {firstAttendanceUnits.map((unit) => (
              <CheckboxOption
                key={unit}
                checked={filters.firstAttendanceUnits.includes(unit)}
                label={unit}
                onChange={(checked) =>
                  patch({
                    firstAttendanceUnits: toggleListValue(
                      filters.firstAttendanceUnits,
                      unit,
                      checked,
                    ),
                  })
                }
              />
            ))}
          </FilterSection>
        ) : null}

        <FilterSection title="Faixa etária">
          {(
            [
              { value: 'all' as AgeGroupFilter, label: 'Todas' },
              { value: '0-17' as AgeGroupFilter, label: '0–17 anos' },
              { value: '18-29' as AgeGroupFilter, label: '18–29 anos' },
              { value: '30-59' as AgeGroupFilter, label: '30–59 anos' },
              { value: '60+' as AgeGroupFilter, label: '60+ anos' },
            ] as const
          ).map((option) => (
            <RadioOption
              key={option.value}
              name="age-group"
              checked={filters.ageGroup === option.value}
              label={option.label}
              onChange={() => patch({ ageGroup: option.value })}
            />
          ))}
        </FilterSection>

        <FilterSection title="Gênero">
          {(
            [
              { value: 'all' as GenderFilter, label: 'Todos' },
              { value: 'Feminino' as GenderFilter, label: 'Feminino' },
              { value: 'Masculino' as GenderFilter, label: 'Masculino' },
            ] as const
          ).map((option) => (
            <RadioOption
              key={option.value}
              name="gender"
              checked={filters.gender === option.value}
              label={option.label}
              onChange={() => patch({ gender: option.value })}
            />
          ))}
        </FilterSection>

        <FilterSection title="Ordenação">
          <CustomSelect
            value={filters.sortBy}
            onChange={(value) => patch({ sortBy: value as SortOption })}
            options={SORT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </FilterSection>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="text-xs font-semibold text-gray-600 transition hover:text-gray-900 disabled:opacity-40"
        >
          Limpar filtros
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Aplicar ({resultCount})
        </button>
      </footer>
    </div>,
    document.body,
  )
}
