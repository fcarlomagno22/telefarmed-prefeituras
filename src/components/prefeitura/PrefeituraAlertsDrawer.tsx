import { AlertTriangle, Clock, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraAlert } from '../../types/prefeituraDashboard'

type PrefeituraAlertsDrawerProps = {
  open: boolean
  closing: boolean
  alerts: PrefeituraAlert[]
  onClose: () => void
  onTransitionEnd: () => void
}

type SeverityFilter = 'all' | 'critical' | 'warning'

const statusLabels = {
  open: { label: 'Aberto', className: 'bg-red-50 text-red-700 ring-red-200/80' },
  acknowledged: {
    label: 'Reconhecido',
    className: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  },
  in_progress: {
    label: 'Em tratativa',
    className: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  },
} as const

function severityRank(severity: PrefeituraAlert['severity']) {
  return severity === 'critical' ? 0 : 1
}

export function PrefeituraAlertsDrawer({
  open,
  closing,
  alerts,
  onClose,
  onTransitionEnd,
}: PrefeituraAlertsDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setSeverityFilter('all')
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

  const filteredAlerts = useMemo(() => {
    const list =
      severityFilter === 'all'
        ? alerts
        : alerts.filter((alert) => alert.severity === severityFilter)

    return [...list].sort((a, b) => {
      const bySeverity = severityRank(a.severity) - severityRank(b.severity)
      if (bySeverity !== 0) return bySeverity
      return a.title.localeCompare(b.title, 'pt-BR')
    })
  }, [alerts, severityFilter])

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length

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
        aria-label="Fechar alertas"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-alerts-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="prefeitura-alerts-drawer-title" className="text-lg font-bold text-gray-900">
                Alertas da rede
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {alerts.length} alerta{alerts.length === 1 ? '' : 's'} no recorte atual ·{' '}
                {criticalCount} crítico{criticalCount === 1 ? '' : 's'} · {warningCount} em atenção
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

        <div className="shrink-0 border-b border-gray-200 bg-gray-50/70 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all' as const, label: `Todos (${alerts.length})` },
                { id: 'critical' as const, label: `Críticos (${criticalCount})` },
                { id: 'warning' as const, label: `Atenção (${warningCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  severityFilter === tab.id
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          {filteredAlerts.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Nenhum alerta para o filtro selecionado
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical'
                const status = statusLabels[alert.status]

                return (
                  <li
                    key={alert.id}
                    className={[
                      'overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
                      isCritical ? 'border-red-200/90' : 'border-amber-200/90',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex items-start gap-3 border-b px-4 py-3',
                        isCritical ? 'border-red-100 bg-red-50/50' : 'border-amber-100 bg-amber-50/40',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
                        ].join(' ')}
                      >
                        {isCritical ? (
                          <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                        ) : (
                          <Clock className="h-5 w-5" strokeWidth={2} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{alert.title}</h3>
                          <span className="shrink-0 text-xs font-medium text-gray-400">
                            {alert.timeAgo}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-gray-600">{alert.unit}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            {alert.category}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${status.className}`}
                          >
                            {status.label}
                          </span>
                          <span className="text-[10px] text-gray-400">{alert.detectedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-3 text-sm text-gray-700">
                      <p className="leading-relaxed">{alert.description}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Impacto
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-gray-700">{alert.impact}</p>
                        </div>
                        <div className="rounded-xl border border-[var(--brand-primary)]/15 bg-[var(--brand-primary-light)]/30 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                            Ação recomendada
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-gray-800">
                            {alert.recommendedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            Lista reflete os filtros aplicados no painel municipal
          </p>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
