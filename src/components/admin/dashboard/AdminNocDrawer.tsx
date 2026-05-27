import { AlertTriangle, Clock, ShieldAlert, User, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  adminNocCategoryLabels,
  adminNocTeams,
  type AdminNocIncident,
  type AdminNocStatus,
} from '../../../data/adminDashboardMock'

type AdminNocDrawerProps = {
  open: boolean
  closing: boolean
  incidents: AdminNocIncident[]
  onClose: () => void
  onTransitionEnd: () => void
}

type StatusFilter = 'all' | AdminNocStatus

const statusLabels = {
  open: { label: 'Aberto', className: 'bg-red-50 text-red-700 ring-red-200/80' },
  in_progress: {
    label: 'Em tratamento',
    className: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  },
  resolved: {
    label: 'Resolvido',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  },
} as const

const priorityLabels = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
} as const

function priorityRank(priority: AdminNocIncident['priority']) {
  if (priority === 'critical') return 0
  if (priority === 'high') return 1
  return 2
}

export function AdminNocDrawer({
  open,
  closing,
  incidents,
  onClose,
  onTransitionEnd,
}: AdminNocDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setStatusFilter('all')
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

  const filtered = useMemo(() => {
    const list =
      statusFilter === 'all'
        ? incidents
        : incidents.filter((item) => item.status === statusFilter)
    return [...list].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
  }, [incidents, statusFilter])

  const openCount = incidents.filter((i) => i.status === 'open').length
  const inProgressCount = incidents.filter((i) => i.status === 'in_progress').length

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
        aria-label="Fechar central de incidentes"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-noc-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-slate-100 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Operação Telefarmed
              </p>
              <h2 id="admin-noc-drawer-title" className="text-lg font-bold text-gray-900">
                Central de incidentes da plataforma
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {incidents.length} incidente{incidents.length === 1 ? '' : 's'} · {openCount} aberto
                {openCount === 1 ? '' : 's'} · {inProgressCount} em tratamento
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-gray-200 bg-gray-50/70 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all' as const, label: `Todos (${incidents.length})` },
                { id: 'open' as const, label: `Abertos (${openCount})` },
                { id: 'in_progress' as const, label: `Em tratamento (${inProgressCount})` },
                {
                  id: 'resolved' as const,
                  label: `Resolvidos (${incidents.filter((i) => i.status === 'resolved').length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Nenhum incidente para o filtro selecionado
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((incident) => {
                const status = statusLabels[incident.status]
                const isCritical = incident.priority === 'critical'

                return (
                  <li
                    key={incident.id}
                    className={[
                      'overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
                      isCritical ? 'border-red-200/90' : 'border-gray-200',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex items-start gap-3 border-b px-4 py-3',
                        isCritical ? 'border-red-100 bg-red-50/50' : 'border-gray-100 bg-slate-50/80',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          isCritical ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
                        ].join(' ')}
                      >
                        {incident.category === 'security' ? (
                          <ShieldAlert className="h-5 w-5" strokeWidth={2} />
                        ) : (
                          <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{incident.title}</h3>
                          <span className="shrink-0 text-xs text-gray-400">{incident.timeAgo}</span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-gray-600">
                          {incident.municipality} · {adminNocCategoryLabels[incident.category]}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${status.className}`}
                          >
                            {status.label}
                          </span>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            Prioridade {priorityLabels[incident.priority]}
                          </span>
                          {incident.internalSlaBreached ? (
                            <span className="text-[10px] font-bold text-red-600">SLA interno estourado</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                              <Clock className="h-3 w-3" />
                              SLA {incident.internalSlaHours}h
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-3 text-sm text-gray-700">
                      <p className="leading-relaxed">{incident.description}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Impacto
                          </p>
                          <p className="mt-1 text-xs leading-relaxed">{incident.impact}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--brand-primary)]/15 bg-[var(--brand-primary-light)]/30 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                            Ação recomendada
                          </p>
                          <p className="mt-1 text-xs leading-relaxed">{incident.recommendedAction}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-semibold">
                            {incident.assignee ?? 'Sem responsável'}
                          </span>
                        </span>
                        <label className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-500">Time:</span>
                          <select
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800"
                            defaultValue={incident.team}
                            aria-label={`Atribuir time do incidente ${incident.id}`}
                          >
                            {adminNocTeams.map((team) => (
                              <option key={team} value={team}>
                                {team}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          Histórico
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {incident.history.map((entry, index) => (
                            <li
                              key={`${incident.id}-hist-${index}`}
                              className="rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-700"
                            >
                              <span className="font-semibold text-gray-500">{entry.at}</span> ·{' '}
                              <span className="font-medium text-gray-800">{entry.actor}</span> —{' '}
                              {entry.note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 text-center text-xs text-gray-500 sm:px-6">
          Lista reflete o recorte atual do painel administrativo
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
