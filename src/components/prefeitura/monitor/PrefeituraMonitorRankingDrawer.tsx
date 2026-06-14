import { BarChart3, Building2, Trophy, TrendingUp, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  monitorComparisonPrimaryColumn,
  monitorComparisonTabs,
  type MonitorComparisonRow,
  type MonitorComparisonTab,
} from '../../../types/prefeituraMonitor'
import { KpiStatCards, kpiStatStylePresets, type KpiStatCardItem } from '../../ui/KpiStatCards'
import { PrefeituraMonitorUbsComparisonTable } from './PrefeituraMonitorUbsComparisonTable'

type PrefeituraMonitorRankingDrawerProps = {
  open: boolean
  closing: boolean
  initialTab: MonitorComparisonTab
  activeTab: MonitorComparisonTab
  onTabChange: (tab: MonitorComparisonTab) => void
  getRankingForTab: (tab: MonitorComparisonTab) => MonitorComparisonRow[]
  isLoading?: boolean
  loadError?: string | null
  onClose: () => void
  onTransitionEnd: () => void
}

function formatSummaryValue(tab: MonitorComparisonTab, value: number) {
  return monitorComparisonPrimaryColumn[tab].format(value)
}

export function PrefeituraMonitorRankingDrawer({
  open,
  closing,
  initialTab,
  activeTab,
  onTabChange,
  getRankingForTab,
  isLoading = false,
  loadError = null,
  onClose,
  onTransitionEnd,
}: PrefeituraMonitorRankingDrawerProps) {
  const [entered, setEntered] = useState(false)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  const rows = getRankingForTab(activeTab)
  const column = monitorComparisonPrimaryColumn[activeTab]
  const activeTabLabel =
    monitorComparisonTabs.find((tab) => tab.key === activeTab)?.label ?? activeTab

  const summary = useMemo(() => {
    const activeRows = rows.filter((row) => row.primaryValue > 0)
    const totalValue = activeRows.reduce((sum, row) => sum + row.primaryValue, 0)
    const avgValue = activeRows.length > 0 ? totalValue / activeRows.length : 0
    const leader = rows[0]
    const positiveCount = rows.filter((row) => row.variationPercent > 0).length
    const negativeCount = rows.filter((row) => row.variationPercent < 0).length

    return {
      unitCount: rows.length,
      leaderName: leader?.unitName ?? '—',
      leaderValue: leader ? formatSummaryValue(activeTab, leader.primaryValue) : '—',
      avgValue: formatSummaryValue(activeTab, avgValue),
      positiveCount,
      negativeCount,
    }
  }, [rows, activeTab])

  const kpiItems = useMemo((): KpiStatCardItem[] => {
    const [sky, orange, violet, emerald] = kpiStatStylePresets

    return [
      {
        label: 'Unidades',
        value: String(summary.unitCount),
        suffix: 'no ranking',
        icon: Building2,
        ...sky,
      },
      {
        label: '1º lugar',
        value: summary.leaderName,
        suffix: summary.leaderValue,
        icon: Trophy,
        ...orange,
      },
      {
        label: 'Média da rede',
        value: summary.avgValue,
        suffix: column.header,
        icon: BarChart3,
        ...violet,
      },
      {
        label: 'Variação (dia)',
        value: String(summary.positiveCount),
        suffix: `${summary.negativeCount} em queda`,
        icon: TrendingUp,
        ...emerald,
      },
    ]
  }, [summary, column.header])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, initialTab])

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
        aria-label="Fechar ranking completo"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-monitor-ranking-drawer-title"
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
              <h2 id="prefeitura-monitor-ranking-drawer-title" className="text-lg font-bold text-gray-900">
                Comparativo entre UBS
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ranking completo da rede · indicador: {activeTabLabel}
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

        <div className="shrink-0 border-b border-gray-200 bg-gray-50/70 px-5 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <KpiStatCards
              items={kpiItems}
              updateKey={activeTab}
              animated
              className="gap-3 sm:grid-cols-2 lg:grid-cols-4"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-5 py-2 sm:px-6">
            <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-600">
              Use as abas para alternar entre produtividade, abandono, espera e avaliação.
            </p>
          </div>

          {loadError ? (
            <p className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              {loadError}
            </p>
          ) : null}

          {isLoading && rows.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-sm text-gray-500">
              Carregando ranking completo…
            </div>
          ) : (
            <PrefeituraMonitorUbsComparisonTable
              activeTab={activeTab}
              onTabChange={onTabChange}
              rows={rows}
              stickyHeader
            />
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
