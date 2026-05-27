import { CalendarDays, RotateCcw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { systemPages } from '../../config/accessCredentials'
import { accessLogs } from '../../data/accessLogsMock'
import { initialAccessCredentialUsers } from '../../data/accessCredentialsMock'
import {
  applyAccessLogsFilters,
  countActiveAccessLogFilters,
  defaultAccessLogsFilters,
  formatAccessLogDateLabel,
  formatAccessLogTime,
  type AccessLogsDatePreset,
  type AccessLogsFilters,
} from '../../utils/accessLogsFilters'
import { AccessLogOutcomeBadge } from './accessCredentialBadges'
import { CompactDatePicker } from '../ui/CompactDatePicker'
import { CustomSelect } from '../ui/CustomSelect'

type AccessLogsDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
}

const datePresets: { id: AccessLogsDatePreset; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7', label: 'Últimos 7 dias' },
  { id: 'custom', label: 'Escolher dia' },
  { id: 'all', label: 'Todos' },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function AccessLogsDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
}: AccessLogsDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [filters, setFilters] = useState<AccessLogsFilters>(defaultAccessLogsFilters)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setFilters(defaultAccessLogsFilters())
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const filteredLogs = useMemo(() => applyAccessLogsFilters(accessLogs, filters), [filters])

  const successCount = filteredLogs.filter((log) => log.outcome === 'success').length
  const failureCount = filteredLogs.length - successCount
  const activeFilterCount = countActiveAccessLogFilters(filters)

  const groupedLogs = useMemo(() => {
    const map = new Map<string, typeof filteredLogs>()
    for (const entry of filteredLogs) {
      const label = formatAccessLogDateLabel(entry.accessedAt)
      const existing = map.get(label) ?? []
      existing.push(entry)
      map.set(label, existing)
    }
    return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }))
  }, [filteredLogs])

  const userOptions = useMemo(
    () => [
      { value: '', label: 'Todos os usuários' },
      ...initialAccessCredentialUsers.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    ],
    [],
  )

  const pageOptions = useMemo(
    () => [
      { value: '', label: 'Todas as páginas' },
      ...systemPages.map((page) => ({ value: page.id, label: page.label })),
    ],
    [],
  )

  const outcomeOptions = [
    { value: 'all', label: 'Todos os resultados' },
    { value: 'success', label: 'Acesso liberado' },
    { value: 'failure', label: 'Acesso negado' },
  ]

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar histórico de acessos"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-logs-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[95vh] max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/40 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="access-logs-drawer-title" className="text-lg font-bold text-gray-900">
                Todos os acessos
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Consulte entradas no sistema, filtre por dia, usuário e página acessada.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="shrink-0 space-y-4 border-b border-gray-200 bg-gray-50/60 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {datePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, datePreset: preset.id }))
                }
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                  filters.datePreset === preset.id
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {filters.datePreset === 'custom' ? (
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Data do acesso
              </label>
              <CompactDatePicker
                value={filters.customDate}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, customDate: value }))
                }
              />
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-3 items-end">
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Buscar</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Nome, e-mail, página, dispositivo..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Usuário</label>
              <CustomSelect
                value={filters.userId}
                onChange={(value) => setFilters((prev) => ({ ...prev, userId: value }))}
                options={userOptions}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Página</label>
              <CustomSelect
                value={filters.pageId}
                onChange={(value) => setFilters((prev) => ({ ...prev, pageId: value }))}
                options={pageOptions}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Resultado</label>
              <CustomSelect
                value={filters.outcome}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    outcome: value as AccessLogsFilters['outcome'],
                  }))
                }
                options={outcomeOptions}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {formatNumber(filteredLogs.length)}
              </span>{' '}
              acesso{filteredLogs.length === 1 ? '' : 's'} encontrado
              {filteredLogs.length === 1 ? '' : 's'}
              {filteredLogs.length > 0 ? (
                <span className="text-gray-500">
                  {' '}
                  · {formatNumber(successCount)} liberado{successCount === 1 ? '' : 's'}
                  {failureCount > 0
                    ? ` · ${formatNumber(failureCount)} negado${failureCount === 1 ? '' : 's'}`
                    : ''}
                </span>
              ) : null}
            </p>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={() => setFilters(defaultAccessLogsFilters())}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center">
              <CalendarDays className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-gray-700">
                Nenhum acesso encontrado
              </p>
              <p className="mt-1 max-w-sm text-xs text-gray-500">
                Ajuste o dia, o usuário ou os filtros para localizar registros de entrada no
                painel.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedLogs.map((group) => (
                <section key={group.label}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {group.label}
                  </h3>
                  <ul className="space-y-2">
                    {group.entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {entry.avatarUrl ? (
                            <img
                              src={entry.avatarUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${entry.avatarClassName}`}
                            >
                              {entry.initials}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {entry.userName}
                            </p>
                            <p className="truncate text-xs text-gray-500">{entry.userEmail}</p>
                          </div>
                        </div>

                        <div className="grid min-w-0 flex-1 gap-2 text-sm sm:grid-cols-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                              Horário
                            </p>
                            <p className="font-medium tabular-nums text-gray-800">
                              {formatAccessLogTime(entry.accessedAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                              Página
                            </p>
                            <p className="font-medium text-gray-800">{entry.pageLabel}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                              Dispositivo
                            </p>
                            <p className="truncate font-medium text-gray-800">{entry.device}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                          <AccessLogOutcomeBadge outcome={entry.outcome} />
                          <span className="text-[11px] tabular-nums text-gray-400">
                            {entry.ipAddress}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Fechar
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
