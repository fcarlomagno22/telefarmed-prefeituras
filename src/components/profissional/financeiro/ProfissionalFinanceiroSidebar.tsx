import { History } from 'lucide-react'
import { useMemo } from 'react'
import type { ProfissionalCompetenceClosure } from '../../../types/profissionalFinanceiro'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { formatCompetenceLabel } from '../../../utils/profissional/profissionalCompetence'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  PROFISSIONAL_CLOSURE_STATUS_BADGE_WIDTH,
  profissionalClosureStatusBadgeConfig,
  profissionalFinanceiroAlignedPanelClass,
} from './profissionalFinanceiroUi'

type ForecastRow = {
  key: string
  realizados: number
  qtdConsultas: number
}

type ProfissionalFinanceiroHistorySectionProps = {
  activeCompetenceKey: string
  closures: ProfissionalCompetenceClosure[]
  forecastRows: ForecastRow[]
  onSelectCompetence: (key: string) => void
}

export function ProfissionalFinanceiroHistorySection({
  activeCompetenceKey,
  closures,
  forecastRows,
  onSelectCompetence,
}: ProfissionalFinanceiroHistorySectionProps) {
  const history = useMemo(() => {
    return [...forecastRows]
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((row) => {
        const closure = closures.find((c) => c.competenceKey === row.key)
        return {
          key: row.key,
          label: formatCompetenceLabel(row.key),
          forecastCents: row.realizados,
          shiftCount: row.qtdConsultas,
          status: closure?.status ?? 'aberto',
        }
      })
  }, [closures, forecastRows])

  return (
    <section className={profissionalFinanceiroAlignedPanelClass} data-tour="financeiro-history">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" aria-hidden />
          <h3 className="text-sm font-bold text-gray-900">Histórico de competências</h3>
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain divide-y divide-gray-100">
        {history.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-gray-500 sm:px-5">
            Nenhuma competência registrada.
          </li>
        ) : (
          history.map((item) => {
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
                    {item.shiftCount} consulta{item.shiftCount === 1 ? '' : 's'} ·{' '}
                    <span className="font-semibold text-gray-800">
                      {formatProfissionalCurrency(item.forecastCents)}
                    </span>
                  </p>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
