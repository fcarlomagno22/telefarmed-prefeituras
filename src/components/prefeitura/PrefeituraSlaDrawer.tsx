import { Building2, Clock, MapPin, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraSlaStatus, PrefeituraUbsRow } from '../../types/prefeituraDashboard'
import { SituationStatusBadge } from '../ui/SituationStatusBadge'
import {
  formatPrefeituraNumber,
  prefeituraSlaBadgeConfig,
  prefeituraSlaDotClass,
} from './prefeituraDashboardUi'

type PrefeituraSlaDrawerProps = {
  open: boolean
  closing: boolean
  ubsRows: PrefeituraUbsRow[]
  onClose: () => void
  onTransitionEnd: () => void
}

type SlaFilter = 'all' | PrefeituraSlaStatus

function waitMinutes(wait: string) {
  return parseInt(wait, 10) || 0
}

const slaGuidance: Record<PrefeituraSlaStatus, string> = {
  normal: 'Tempo de espera dentro da meta operacional da rede.',
  atencao: 'Aproximando do limite de atenção — requer monitoramento.',
  critico: 'Acima do patamar crítico — priorizar desfecho da fila.',
}

export function PrefeituraSlaDrawer({
  open,
  closing,
  ubsRows,
  onClose,
  onTransitionEnd,
}: PrefeituraSlaDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [filter, setFilter] = useState<SlaFilter>('all')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setFilter('all')
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

  const sortedAll = useMemo(
    () => [...ubsRows].sort((a, b) => waitMinutes(b.avgWait) - waitMinutes(a.avgWait)),
    [ubsRows],
  )

  const filteredList = useMemo(() => {
    if (filter === 'all') return sortedAll
    return sortedAll.filter((row) => row.sla === filter)
  }, [sortedAll, filter])

  const maxWait = Math.max(...sortedAll.map((r) => waitMinutes(r.avgWait)), 1)
  const criticalCount = sortedAll.filter((r) => r.sla === 'critico').length
  const attentionCount = sortedAll.filter((r) => r.sla === 'atencao').length
  const normalCount = sortedAll.filter((r) => r.sla === 'normal').length

  const avgWaitMinutes =
    sortedAll.length > 0
      ? Math.round(
          sortedAll.reduce((sum, row) => sum + waitMinutes(row.avgWait) * row.queueNow, 0) /
            Math.max(
              1,
              sortedAll.reduce((sum, row) => sum + row.queueNow, 0),
            ),
        )
      : 0

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
        aria-label="Fechar SLA por unidade"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-sla-drawer-title"
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
              <h2 id="prefeitura-sla-drawer-title" className="text-lg font-bold text-gray-900">
                SLA por unidade
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Tempo médio de espera · {sortedAll.length} UBT no recorte · média ponderada{' '}
                {avgWaitMinutes} min
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
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Críticas
              </p>
              <p className="text-base font-bold tabular-nums text-red-600">{criticalCount}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Atenção
              </p>
              <p className="text-base font-bold tabular-nums text-amber-700">{attentionCount}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Normais
              </p>
              <p className="text-base font-bold tabular-nums text-emerald-700">{normalCount}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Maior espera
              </p>
              <p className="text-base font-bold tabular-nums text-gray-900">
                {sortedAll[0] ? sortedAll[0].avgWait : '—'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all' as const, label: `Todas (${sortedAll.length})` },
                { id: 'critico' as const, label: `Crítico (${criticalCount})` },
                { id: 'atencao' as const, label: `Atenção (${attentionCount})` },
                { id: 'normal' as const, label: `Normal (${normalCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  filter === tab.id
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
          {filteredList.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Nenhuma unidade para o filtro selecionado
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredList.map((unit, index) => {
                const minutes = waitMinutes(unit.avgWait)
                const barPercent = maxWait > 0 ? Math.max(8, (minutes / maxWait) * 100) : 0
                const badge = prefeituraSlaBadgeConfig[unit.sla]

                return (
                  <li
                    key={unit.id}
                    className={[
                      'overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]',
                      unit.sla === 'critico'
                        ? 'border-red-200/90'
                        : unit.sla === 'atencao'
                          ? 'border-amber-200/90'
                          : 'border-gray-200/90',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex items-start gap-3 border-b px-4 py-3',
                        unit.sla === 'critico'
                          ? 'border-red-100 bg-red-50/40'
                          : unit.sla === 'atencao'
                            ? 'border-amber-100 bg-amber-50/35'
                            : 'border-gray-100 bg-slate-50/60',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          unit.sla === 'critico'
                            ? 'bg-red-100 text-red-600'
                            : unit.sla === 'atencao'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-emerald-100 text-emerald-600',
                        ].join(' ')}
                      >
                        <Clock className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              #{index + 1} · SLA
                            </p>
                            <h3 className="text-sm font-bold text-gray-900">{unit.name}</h3>
                          </div>
                          <span className="text-xl font-bold tabular-nums text-gray-900">
                            {unit.avgWait}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <SituationStatusBadge config={badge} widthClass="w-[5.5rem]" />
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {unit.region}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500">
                            {unit.type}
                          </span>
                        </div>
                      </div>
                      <Building2
                        className="h-5 w-5 shrink-0 text-gray-300"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>

                    <div className="space-y-3 px-4 py-3">
                      <div className="relative h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${badge.accent}`}
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Fila atual
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {unit.queueNow} paciente{unit.queueNow === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Consultas hoje
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {formatPrefeituraNumber(unit.consultationsToday)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Faltas hoje
                          </p>
                          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
                            {unit.absencesToday}
                          </p>
                        </div>
                      </div>

                      <p className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs leading-relaxed text-gray-600">
                        <span
                          className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${prefeituraSlaDotClass[unit.sla]}`}
                        />
                        {slaGuidance[unit.sla]}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            Ordenado por maior tempo de espera · dados conforme filtros do painel
          </p>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
