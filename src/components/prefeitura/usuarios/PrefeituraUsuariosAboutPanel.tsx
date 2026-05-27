import { useEffect, useState } from 'react'
import { brand } from '../../../config/brand'
import {
  prefeituraMunicipalPatientsAbout,
  type PrefeituraMunicipalPatientsMonthSlice,
  type PrefeituraMunicipalPatientsNeighborhoodSlice,
  type PrefeituraMunicipalPatientsUnitSlice,
} from '../../../data/prefeituraMunicipalPatientsMock'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

function useChartFillAnimation(delayMs = 60) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return animate
}

function NewRegistrationsByMonth({ slices }: { slices: PrefeituraMunicipalPatientsMonthSlice[] }) {
  const animate = useChartFillAnimation(80)
  const maxCount = Math.max(...slices.map((s) => s.count))
  const chartHeight = 100

  return (
    <div
      className="flex items-end justify-between gap-1.5"
      role="img"
      aria-label={`Novos cadastros por mês: ${slices.map((s) => `${s.label} ${formatNumber(s.count)}`).join(', ')}`}
    >
      {slices.map((slice, index) => {
        const heightPx =
          maxCount > 0
            ? Math.max(12, (slice.count / maxCount) * chartHeight)
            : 0

        return (
          <div key={slice.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold tabular-nums text-gray-700">
              {animate ? formatNumber(slice.count) : '—'}
            </span>
            <div className="flex w-full items-end justify-center" style={{ height: chartHeight }}>
              <div
                className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[var(--brand-primary)] to-orange-400"
                style={{
                  height: animate ? heightPx : 0,
                  transition: `height 0.9s ${CHART_EASE} ${index * 0.1}s`,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-gray-500">{slice.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function RegistrationNeighborhoodBars({
  slices,
}: {
  slices: PrefeituraMunicipalPatientsNeighborhoodSlice[]
}) {
  const animate = useChartFillAnimation(120)
  const max = Math.max(...slices.map((s) => s.registrations))

  return (
    <ul className="space-y-2">
      {slices.map((slice, index) => (
        <li key={slice.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate font-medium text-gray-600">{slice.label}</span>
            <span
              className="shrink-0 font-semibold tabular-nums text-gray-900"
              style={{
                opacity: animate ? 1 : 0,
                transition: `opacity 0.5s ${CHART_EASE} ${index * 0.08}s`,
              }}
            >
              {formatNumber(slice.registrations)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
              style={{
                width: animate ? `${(slice.registrations / max) * 100}%` : '0%',
                transition: `width 0.85s ${CHART_EASE} ${index * 0.1}s`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function FirstUnitBars({ slices }: { slices: PrefeituraMunicipalPatientsUnitSlice[] }) {
  const animate = useChartFillAnimation(160)
  const max = Math.max(...slices.map((s) => s.registrations))

  return (
    <ul className="space-y-2.5">
      {slices.map((slice, index) => (
        <li key={slice.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="min-w-0 flex-1 truncate font-medium text-gray-600">
              {slice.label}
            </span>
            <span
              className="shrink-0 font-semibold tabular-nums text-gray-900"
              style={{
                opacity: animate ? 1 : 0,
                transition: `opacity 0.5s ${CHART_EASE} ${index * 0.08}s`,
              }}
            >
              {formatNumber(slice.registrations)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
              style={{
                width: animate ? `${(slice.registrations / max) * 100}%` : '0%',
                transition: `width 0.85s ${CHART_EASE} ${index * 0.1}s`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PrefeituraUsuariosAboutPanel() {
  const illustrationUrl = brand.dashboardUsersAboutImageUrl
  const {
    newRegistrationsByMonth,
    registrationsByNeighborhood,
    registrationsByFirstUnit,
  } = prefeituraMunicipalPatientsAbout

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      {illustrationUrl ? (
        <div className="shrink-0 overflow-hidden bg-gradient-to-b from-sky-50/50 to-white px-4 pt-4">
          <img
            src={illustrationUrl}
            alt=""
            className="mx-auto h-32 w-full max-w-[240px] object-contain object-center"
          />
        </div>
      ) : null}

      <div className="flex flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Indicadores municipais</h2>
        </header>

        <div className="mt-4 flex flex-col gap-4">
          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Novos cadastros por mês
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">Últimos 6 meses na base única</p>
            <div className="mt-3">
              <NewRegistrationsByMonth slices={newRegistrationsByMonth} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cadastros por bairro
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">Top 5 territórios</p>
            <div className="mt-3">
              <RegistrationNeighborhoodBars slices={registrationsByNeighborhood} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Por unidade de 1º atendimento
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">Onde o paciente entrou na rede</p>
            <div className="mt-3">
              <FirstUnitBars slices={registrationsByFirstUnit} />
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
