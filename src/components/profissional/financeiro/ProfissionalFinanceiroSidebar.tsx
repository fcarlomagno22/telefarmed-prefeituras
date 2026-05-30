import { History } from 'lucide-react'
import { useMemo } from 'react'
import type { ProfissionalCompetenceClosure } from '../../../types/profissionalFinanceiro'
import {
  buildProfissionalBillingShifts,
  filterBillingShiftsByCompetence,
} from '../../../utils/profissional/buildProfissionalBillingShifts'
import { computeProfissionalFinanceiroStats } from '../../../utils/profissional/computeProfissionalFinanceiroStats'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { formatCompetenceLabel } from '../../../utils/profissional/profissionalCompetence'
import { profissionalFinanceiroAvailableCompetences } from '../../../data/profissionalFinanceiroMock'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  PROFISSIONAL_CLOSURE_STATUS_BADGE_WIDTH,
  profissionalClosureStatusBadgeConfig,
  profissionalFinanceiroAlignedPanelClass,
} from './profissionalFinanceiroUi'

type ProfissionalFinanceiroHistorySectionProps = {
  activeCompetenceKey: string
  closures: ProfissionalCompetenceClosure[]
  onSelectCompetence: (key: string) => void
}

export function ProfissionalFinanceiroHistorySection({
  activeCompetenceKey,
  closures,
  onSelectCompetence,
}: ProfissionalFinanceiroHistorySectionProps) {
  const allShifts = useMemo(() => buildProfissionalBillingShifts(), [])

  const history = useMemo(() => {
    return [...profissionalFinanceiroAvailableCompetences].reverse().map((key) => {
      const shifts = filterBillingShiftsByCompetence(allShifts, key)
      const stats = computeProfissionalFinanceiroStats(shifts)
      const closure = closures.find((c) => c.competenceKey === key)
      return {
        key,
        label: formatCompetenceLabel(key),
        forecastCents: stats.forecastCents,
        shiftCount: stats.realizedCount,
        status: closure?.status ?? 'aberto',
      }
    })
  }, [allShifts, closures])

  return (
    <section className={profissionalFinanceiroAlignedPanelClass} data-tour="financeiro-history">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" aria-hidden />
          <h3 className="text-sm font-bold text-gray-900">Histórico de competências</h3>
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain divide-y divide-gray-100">
        {history.map((item) => {
          const isActive = item.key === activeCompetenceKey
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onSelectCompetence(item.key)}
                className={[
                  'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition sm:px-5',
                  isActive ? 'bg-[var(--brand-primary-light)]/50' : 'hover:bg-gray-50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 text-sm font-semibold text-gray-900">{item.label}</span>
                  <SituationStatusBadge
                    config={profissionalClosureStatusBadgeConfig[item.status]}
                    widthClass={PROFISSIONAL_CLOSURE_STATUS_BADGE_WIDTH}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {item.shiftCount} plantão{item.shiftCount === 1 ? '' : 's'} realizados ·{' '}
                  <span className="font-semibold text-gray-800">
                    {formatProfissionalCurrency(item.forecastCents)}
                  </span>
                </p>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
