import type { ReactNode } from 'react'
import { CalendarCheck, TrendingUp, Wallet } from 'lucide-react'
import type { ProfissionalFinanceiroStats } from '../../../utils/profissional/computeProfissionalFinanceiroStats'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { profissionalFinanceiroPanelClass } from './profissionalFinanceiroUi'

type ProfissionalFinanceiroHeroCardProps = {
  competenceLabel: string
  stats: ProfissionalFinanceiroStats
  isCurrentMonth: boolean
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function ProfissionalFinanceiroHeroCard({
  competenceLabel,
  stats,
  isCurrentMonth,
}: ProfissionalFinanceiroHeroCardProps) {
  return (
    <section
      data-tour="financeiro-hero"
      className={[
        profissionalFinanceiroPanelClass,
        'relative shrink-0 overflow-hidden p-0',
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-[var(--brand-primary-light)]/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex min-w-0 shrink-0 flex-col justify-center sm:max-w-[38%]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            {isCurrentMonth ? 'Competência em andamento' : 'Competência'}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {competenceLabel}
          </h2>
          <p className="mt-2 text-sm leading-snug text-gray-600">
            <span className="font-semibold text-gray-900">
              {formatNumber(stats.realizedCount)} plantão
              {stats.realizedCount === 1 ? ' realizado' : 's realizados'}
            </span>
            {stats.scheduledCount > 0 ? (
              <>
                {' '}
                ·{' '}
                <span className="font-semibold text-sky-700">
                  {formatNumber(stats.scheduledCount)} previsto
                  {stats.scheduledCount === 1 ? '' : 's'}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-4 gap-2">
          <HeroKpi
            icon={<Wallet className="h-4 w-4" aria-hidden />}
            label="Previsão (realizados)"
            value={formatProfissionalCurrency(stats.forecastCents)}
            tone="emerald"
            currency
          />
          <HeroKpi
            icon={<TrendingUp className="h-4 w-4" aria-hidden />}
            label="Se todos ocorrerem"
            value={formatProfissionalCurrency(stats.potentialCents)}
            tone="brand"
            currency
          />
          <HeroKpi
            icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
            label="Realizados"
            value={String(stats.realizedCount)}
            tone="neutral"
          />
          <HeroKpi
            icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
            label="Previstos"
            value={String(stats.scheduledCount)}
            tone="neutral"
          />
        </div>
      </div>
    </section>
  )
}

function HeroKpi({
  icon,
  label,
  value,
  tone,
  currency = false,
}: {
  icon: ReactNode
  label: string
  value: string
  tone: 'emerald' | 'brand' | 'neutral'
  currency?: boolean
}) {
  const toneStyles = {
    emerald: 'text-emerald-800 ring-emerald-100/90 bg-emerald-50/50',
    brand: 'text-[var(--brand-primary)] ring-orange-100/90 bg-[var(--brand-primary-light)]/30',
    neutral: 'text-gray-900 ring-gray-100 bg-white/70',
  }[tone]

  return (
    <div
      className={[
        'flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-3 text-center ring-1 sm:px-3',
        toneStyles,
      ].join(' ')}
    >
      <span className="text-[var(--brand-primary)] opacity-90">{icon}</span>
      <p
        className={[
          'mt-1.5 w-full font-bold leading-tight tabular-nums',
          currency ? 'text-[11px] whitespace-nowrap sm:text-sm' : 'text-base',
        ].join(' ')}
      >
        {value}
      </p>
      <p className="mt-1 w-full text-[10px] font-semibold leading-tight text-gray-500">
        {label}
      </p>
    </div>
  )
}
