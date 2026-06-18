import {
  ArrowDown,
  ArrowUp,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import type { PrefeituraConsultasUnitDetail } from '../../../data/prefeituraConsultasUnitDetail'
import { PrefeituraConsultasDailyChart } from './PrefeituraConsultasDailyChart'

type PrefeituraConsultasUnitDetailBodyProps = {
  detail: PrefeituraConsultasUnitDetail
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function DeltaPill({
  label,
  value,
  suffix,
  positiveIsGood = true,
}: {
  label: string
  value: number
  suffix: string
  positiveIsGood?: boolean
}) {
  const isPositive = value >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  const Icon = isPositive ? ArrowUp : ArrowDown

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={[
          'mt-1 flex items-center gap-1 text-sm font-bold tabular-nums',
          isGood ? 'text-emerald-600' : 'text-amber-700',
        ].join(' ')}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        {isPositive && value > 0 ? '+' : ''}
        {value}
        {suffix}
      </p>
    </div>
  )
}

export function PrefeituraConsultasUnitDetailBody({ detail }: PrefeituraConsultasUnitDetailBodyProps) {
  const { unit, previousPeriod } = detail

  const maxSpecialty = useMemo(
    () => Math.max(...detail.specialties.map((item) => item.count), 1),
    [detail.specialties],
  )

  const volumeTrend =
    detail.volumeVsNetworkPercent >= 0 ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <TrendingUp className="h-4 w-4" strokeWidth={2} />
        {formatPercent(Math.abs(detail.volumeVsNetworkPercent))}% acima da média da rede
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-amber-800">
        <TrendingDown className="h-4 w-4" strokeWidth={2} />
        {formatPercent(Math.abs(detail.volumeVsNetworkPercent))}% abaixo da média da rede
      </span>
    )

  const kpiCards = [
    {
      label: 'Volume no período',
      value: formatNumber(unit.volumeTotal),
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Concluídas',
      value: formatNumber(unit.completed),
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Taxa conclusão',
      value: `${formatPercent(unit.completionRate)}%`,
      topBar: 'from-teal-400 to-cyan-500',
    },
    {
      label: 'Canceladas',
      value: `${formatNumber(unit.cancelled)} (${formatPercent(unit.cancelledRate)}%)`,
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Duração média',
      value: `${unit.avgDurationMin} min`,
      topBar: 'from-indigo-400 to-violet-500',
    },
  ]

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <article
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <span
              className={`absolute inset-x-3 top-0 h-0.5 rounded-full bg-gradient-to-r ${card.topBar}`}
              aria-hidden
            />
            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {card.label}
            </p>
            <p className="mt-1 text-center text-base font-bold tabular-nums leading-tight text-gray-900">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-50 via-white to-[var(--brand-primary-muted)]/40 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Comparativo com a rede
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{volumeTrend}</p>
            <p className="mt-1 text-xs text-gray-500">
              Média da rede no período: {formatNumber(detail.networkAvgVolume)} consultas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DeltaPill
              label="Volume"
              value={previousPeriod.volumeDeltaPercent}
              suffix="% vs período ant."
            />
            <DeltaPill
              label="Conclusão"
              value={previousPeriod.completionDeltaPp}
              suffix=" p.p."
            />
            <DeltaPill
              label="Cancelam."
              value={previousPeriod.cancelledDeltaPp}
              suffix=" p.p."
              positiveIsGood={false}
            />
            <DeltaPill
              label="Duração"
              value={previousPeriod.durationDeltaMin}
              suffix=" min"
              positiveIsGood={false}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-bold text-gray-900">Consultas por dia</h3>
          <p className="mt-0.5 text-xs text-gray-500">Evolução no período selecionado</p>
          <div className="mt-3">
            <PrefeituraConsultasDailyChart
              data={detail.dailySeries}
              periodTotal={unit.volumeTotal}
              animationKey={`unit-${unit.id}`}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
            Perfil por gênero
          </h3>
          <ul className="space-y-3">
            {detail.genderStats.map((item) => (
              <li key={item.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800">{item.label}</span>
                  <span className="font-bold tabular-nums text-gray-700">
                    {item.percent}% · {formatNumber(item.count)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
          Consultas por especialidade
        </h3>
        <ul className="space-y-3">
          {detail.specialties.map((item, index) => {
            const width = maxSpecialty > 0 ? Math.max(10, (item.count / maxSpecialty) * 100) : 0
            return (
              <li key={item.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-800">{item.label}</span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-gray-600">
                    {formatNumber(item.count)} ({item.percent}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                      transitionDelay: `${index * 40}ms`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
