import { useMemo, useState, type ReactNode } from 'react'
import type { PrefeituraAgendasFuturePeriodId } from '../../../data/prefeituraAgendasMock'
import {
  prefeituraAgendasFuture30Days,
  prefeituraAgendasFuture7Days,
} from '../../../data/prefeituraAgendasMock'
import {
  formatAgendasNumber,
  prefeituraAgendasBottomCardHeightClass,
} from './prefeituraAgendasUi'

const periodTabs: { id: PrefeituraAgendasFuturePeriodId; label: string }[] = [
  { id: '7d', label: 'Próximos 7 dias' },
  { id: '30d', label: 'Próximos 30 dias' },
]

type StatRowProps = {
  label: string
  value: ReactNode
  valueClassName?: string
}

function StatRow({ label, value, valueClassName = 'font-bold text-gray-900' }: StatRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="min-w-0 flex-1 pr-2 text-gray-600">{label}</dt>
      <dd className={['shrink-0 text-right tabular-nums', valueClassName].join(' ')}>
        {value}
      </dd>
    </div>
  )
}

export function PrefeituraAgendasFutureCard() {
  const [period, setPeriod] = useState<PrefeituraAgendasFuturePeriodId>('7d')
  const summary = useMemo(
    () => (period === '7d' ? prefeituraAgendasFuture7Days : prefeituraAgendasFuture30Days),
    [period],
  )

  const confirmedPercent = Math.round((summary.confirmed / summary.total) * 100)

  return (
    <article
      className={[
        'flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        prefeituraAgendasBottomCardHeightClass,
      ].join(' ')}
    >
      <header className="shrink-0 border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-bold text-gray-900">Agendamentos Futuros</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {periodTabs.map((tab) => {
            const isActive = tab.id === period
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id)}
                className={[
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  isActive
                    ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      <dl
        className={[
          'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain py-3 pl-5 pr-6 pb-4 text-sm',
          '[-ms-overflow-style:none] [scrollbar-width:thin]',
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent',
        ].join(' ')}
      >
        <StatRow label="Total de agendamentos" value={formatAgendasNumber(summary.total)} />
        <StatRow label="Média por dia" value={formatAgendasNumber(summary.dailyAverage)} />
        <StatRow
          label="Dia mais movimentado"
          value={
            <>
              {summary.busiestDay}{' '}
              <span className="font-semibold text-red-600">
                ({formatAgendasNumber(summary.busiestCount)})
              </span>
            </>
          }
          valueClassName="font-bold text-gray-800"
        />
        <StatRow
          label="Dia menos movimentado"
          value={
            <>
              {summary.quietestDay}{' '}
              <span className="font-semibold text-emerald-600">
                ({formatAgendasNumber(summary.quietestCount)})
              </span>
            </>
          }
          valueClassName="font-bold text-gray-800"
        />

        <div className="my-0.5 h-px bg-gray-100" aria-hidden />

        <StatRow
          label="Confirmados"
          value={
            <>
              {formatAgendasNumber(summary.confirmed)}{' '}
              <span className="text-gray-500">({confirmedPercent}%)</span>
            </>
          }
          valueClassName="font-bold text-emerald-700"
        />
        <StatRow
          label="Aguardando confirmação"
          value={formatAgendasNumber(summary.pendingConfirmation)}
          valueClassName="font-bold text-amber-700"
        />
        <StatRow
          label="Primeira consulta"
          value={formatAgendasNumber(summary.firstVisits)}
        />
        <StatRow label="Retorno" value={formatAgendasNumber(summary.returnVisits)} />

        <div className="my-0.5 h-px bg-gray-100" aria-hidden />

        <StatRow
          label="Unidade com mais agendamentos"
          value={
            <>
              {summary.topUnit}{' '}
              <span className="text-gray-500">
                ({formatAgendasNumber(summary.topUnitBookings)})
              </span>
            </>
          }
          valueClassName="font-bold text-gray-800"
        />
        <StatRow label="Horário de pico" value={summary.peakHour} />
        <StatRow
          label="Ocupação prevista da rede"
          value={`${summary.occupancyForecastPercent}%`}
          valueClassName="font-bold text-[var(--brand-primary)]"
        />
      </dl>
    </article>
  )
}
