import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleAlert,
  Clock,
  Info,
  RotateCcw,
  Search,
} from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  auditCriticalityOptions,
  auditLogsAdvancedFilterOptions,
  defaultAuditLogsAdvancedFilters,
  type AuditCriticalityLevel,
  type AuditLogsAdvancedFilters,
} from '../../utils/auditLogsAdvancedFilters'
import { CompactDatePicker } from '../ui/CompactDatePicker'
import { CustomSelect } from '../ui/CustomSelect'
import {
  getAuditUbtFilterOptions,
  patchAuditPrefeituraFilter,
} from '../../utils/auditLogs/auditLogTenantFilters'
import { useAuditLogsScopeContext } from './AuditLogsScopeContext'

type AuditLogsAdvancedFiltersMegamenuProps = {
  open: boolean
  filters: AuditLogsAdvancedFilters
  onChange: (filters: AuditLogsAdvancedFilters) => void
  onApply: () => void
  onCancel: () => void
  onClear: () => void
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/20'

const selectClass =
  'py-1.5 px-2.5 text-xs rounded-lg focus:ring-1 focus:ring-[var(--brand-primary)]/20'

const AUDIT_ADVANCED_FILTERS_TRIGGER_ID = 'audit-advanced-filters-trigger'
const PANEL_VIEWPORT_MARGIN = 16
const PANEL_MAX_WIDTH = 920

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

function TimeInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <CompactField label={label}>
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-8 [&::-webkit-calendar-picker-indicator]:opacity-0`}
        />
        <Clock
          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />
      </div>
    </CompactField>
  )
}

function CriticalityIcon({ level }: { level: AuditCriticalityLevel }) {
  const className = 'h-3 w-3 shrink-0'
  if (level === 'critical') {
    return <CircleAlert className={`${className} text-red-600`} strokeWidth={2.25} />
  }
  if (level === 'high') {
    return <AlertTriangle className={`${className} text-orange-600`} strokeWidth={2.25} />
  }
  if (level === 'medium') {
    return <Info className={`${className} text-sky-600`} strokeWidth={2.25} />
  }
  if (level === 'low') {
    return <CheckCircle2 className={`${className} text-emerald-600`} strokeWidth={2.25} />
  }
  return <Circle className={`${className} text-gray-400`} strokeWidth={2} />
}

function CriticalitySelector({
  value,
  onChange,
}: {
  value: AuditCriticalityLevel
  onChange: (value: AuditCriticalityLevel) => void
}) {
  return (
    <CompactField label="Criticidade" className="col-span-2">
      <div className="grid grid-cols-5 gap-1.5">
        {auditCriticalityOptions.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                'flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center transition',
                selected
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-gray-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              <CriticalityIcon level={option.value} />
              <span className="w-full text-[10px] font-semibold leading-tight">{option.label}</span>
            </button>
          )
        })}
      </div>
    </CompactField>
  )
}

function FilterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-0 lg:px-3">
      <GroupTitle>{title}</GroupTitle>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  )
}

export function AuditLogsAdvancedFiltersMegamenu({
  open,
  filters,
  onChange,
  onApply,
  onCancel,
  onClear,
}: AuditLogsAdvancedFiltersMegamenuProps) {
  const { scope, dataset } = useAuditLogsScopeContext()
  const showPlatformFilter = scope === 'admin'
  const showPrefeituraFilter = scope === 'admin'
  const panelRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(filters)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)
  const showUbtFilter =
    (scope === 'admin' && Boolean(draft.prefeitura)) || scope === 'prefeitura'

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null)
      return
    }

    function updatePosition() {
      const trigger = document.getElementById(AUDIT_ADVANCED_FILTERS_TRIGGER_ID)
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(
        PANEL_MAX_WIDTH,
        window.innerWidth - PANEL_VIEWPORT_MARGIN * 2,
      )
      // Alinha a borda direita do painel ao botão; evita colar no canto da tela.
      const left = Math.min(
        Math.max(PANEL_VIEWPORT_MARGIN, rect.right - width),
        window.innerWidth - width - PANEL_VIEWPORT_MARGIN,
      )
      const maxHeight = Math.max(
        240,
        window.innerHeight - rect.bottom - PANEL_VIEWPORT_MARGIN,
      )

      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width,
        maxHeight,
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

  const scopedUbtOptions = useMemo(() => {
    if (scope === 'prefeitura' && dataset.filterOptions.ubts) {
      return [...dataset.filterOptions.ubts]
    }
    return getAuditUbtFilterOptions(draft.prefeitura)
  }, [dataset.filterOptions.ubts, draft.prefeitura, scope])

  function patch<K extends keyof AuditLogsAdvancedFilters>(
    key: K,
    value: AuditLogsAdvancedFilters[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function patchPrefeitura(prefeituraKey: string) {
    setDraft((prev) => ({
      ...prev,
      ...patchAuditPrefeituraFilter(prefeituraKey, prev.ubt),
    }))
  }

  function handleApply() {
    onChange(draft)
    onApply()
  }

  function handleClear() {
    const cleared = defaultAuditLogsAdvancedFilters()
    setDraft(cleared)
    onChange(cleared)
    onClear()
  }

  if (!open || !panelStyle) return null

  return createPortal(
    <div
      ref={panelRef}
      id="audit-advanced-filters-megamenu"
      role="region"
      aria-label="Filtros avançados de auditoria"
      style={panelStyle}
      className="z-[100] flex flex-col overflow-hidden rounded-xl border-2 border-[var(--brand-primary)] bg-white shadow-[0_6px_24px_rgba(255,107,0,0.1)]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-gray-100">
          <FilterColumn title="Período e horário">
            <CompactField label="Data inicial">
              <CompactDatePicker
                value={draft.startDate}
                onChange={(value) => patch('startDate', value)}
                compact
              />
            </CompactField>
            <CompactField label="Data final">
              <CompactDatePicker
                value={draft.endDate}
                onChange={(value) => patch('endDate', value)}
                compact
              />
            </CompactField>
            <TimeInput
              label="De"
              value={draft.timeFrom}
              onChange={(value) => patch('timeFrom', value)}
            />
            <TimeInput
              label="Até"
              value={draft.timeTo}
              onChange={(value) => patch('timeTo', value)}
            />
          </FilterColumn>

          <FilterColumn title="Usuário">
            <CompactField label="Usuário" className="col-span-2">
              <CustomSelect
                value={draft.userId}
                onChange={(value) => patch('userId', value)}
                options={[...auditLogsAdvancedFilterOptions.users]}
                placeholder="Selecione"
                className={selectClass}
              />
            </CompactField>
            <CompactField label="Tipo">
              <CustomSelect
                value={draft.userType}
                onChange={(value) => patch('userType', value)}
                options={[...auditLogsAdvancedFilterOptions.userTypes]}
                className={selectClass}
              />
            </CompactField>
            <CompactField label="Unidade">
              <CustomSelect
                value={draft.unit}
                onChange={(value) => patch('unit', value)}
                options={[...auditLogsAdvancedFilterOptions.units]}
                className={selectClass}
              />
            </CompactField>
            {showPlatformFilter ? (
              <CompactField label="Plataforma" className="col-span-2">
                <CustomSelect
                  value={draft.platform}
                  onChange={(value) => patch('platform', value)}
                  options={[...auditLogsAdvancedFilterOptions.platforms]}
                  className={selectClass}
                />
              </CompactField>
            ) : null}
            {showPrefeituraFilter ? (
              <CompactField label="Prefeitura" className="col-span-2">
                <CustomSelect
                  value={draft.prefeitura}
                  onChange={patchPrefeitura}
                  options={[...auditLogsAdvancedFilterOptions.prefeituras]}
                  className={selectClass}
                />
              </CompactField>
            ) : null}
            {showUbtFilter ? (
              <CompactField label="UBT" className="col-span-2">
                <CustomSelect
                  value={draft.ubt}
                  onChange={(value) => patch('ubt', value)}
                  options={scopedUbtOptions}
                  className={selectClass}
                />
              </CompactField>
            ) : null}
          </FilterColumn>

          <FilterColumn title="Tipo de evento">
            <CompactField label="Ação">
              <CustomSelect
                value={draft.action}
                onChange={(value) => patch('action', value)}
                options={[...auditLogsAdvancedFilterOptions.actions]}
                className={selectClass}
              />
            </CompactField>
            <CompactField label="Categoria">
              <CustomSelect
                value={draft.eventCategory}
                onChange={(value) => patch('eventCategory', value)}
                options={[...auditLogsAdvancedFilterOptions.eventCategories]}
                className={selectClass}
              />
            </CompactField>
            <CriticalitySelector
              value={draft.criticality}
              onChange={(value) => patch('criticality', value)}
            />
          </FilterColumn>
        </div>

        <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
          <div className="min-w-0">
            <GroupTitle>Recursos e dados</GroupTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CompactField label="Módulo / Página">
                <CustomSelect
                  value={draft.module}
                  onChange={(value) => patch('module', value)}
                  options={[...auditLogsAdvancedFilterOptions.modules]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Recurso afetado">
                <input
                  type="text"
                  value={draft.affectedResource}
                  onChange={(e) => patch('affectedResource', e.target.value)}
                  placeholder="pacientes, usuários..."
                  className={inputClass}
                />
              </CompactField>
              <CompactField label="ID do recurso">
                <input
                  type="text"
                  value={draft.resourceId}
                  onChange={(e) => patch('resourceId', e.target.value)}
                  placeholder="123, #456..."
                  className={inputClass}
                />
              </CompactField>
              <CompactField label="IP / Dispositivo">
                <input
                  type="text"
                  value={draft.ipDevice}
                  onChange={(e) => patch('ipDevice', e.target.value)}
                  placeholder="IP, Chrome..."
                  className={inputClass}
                />
              </CompactField>
            </div>
          </div>

          <div className="min-w-0">
            <GroupTitle>Resultado</GroupTitle>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <CompactField label="Resposta do servidor">
                <CustomSelect
                  value={draft.serverResponse}
                  onChange={(value) => patch('serverResponse', value)}
                  options={[...auditLogsAdvancedFilterOptions.serverResponses]}
                  className={selectClass}
                />
              </CompactField>
              <CompactField label="Código HTTP">
                <input
                  type="text"
                  value={draft.httpCode}
                  onChange={(e) => patch('httpCode', e.target.value)}
                  placeholder="200, 403..."
                  className={inputClass}
                />
              </CompactField>
              <CompactField label="Sucesso / Falha">
                <CustomSelect
                  value={draft.outcome}
                  onChange={(value) => patch('outcome', value)}
                  options={[...auditLogsAdvancedFilterOptions.outcomes]}
                  className={selectClass}
                />
              </CompactField>
            </div>
          </div>
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
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(255,107,0,0.3)] transition hover:bg-[var(--brand-primary-hover)] sm:flex-none"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
            Aplicar filtros
          </button>
        </div>
      </footer>
    </div>,
    document.body,
  )
}
