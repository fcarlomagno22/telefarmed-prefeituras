import { Clock, Users } from 'lucide-react'
import { useMemo } from 'react'
import type { PrefeituraUbsDetail } from '../../data/prefeituraUbsDetails'
import { formatPrefeituraNumber } from './prefeituraDashboardUi'

type PrefeituraUbsMetricsSectionsProps = {
  detail: PrefeituraUbsDetail
}

export function PrefeituraUbsMetricsSections({ detail }: PrefeituraUbsMetricsSectionsProps) {
  const { unit } = detail

  const maxHourly = useMemo(
    () => Math.max(...detail.hourlyToday.map((p) => p.value), 1),
    [detail.hourlyToday],
  )

  const maxSpecialty = useMemo(
    () => Math.max(...detail.specialties.map((s) => s.count), 1),
    [detail.specialties],
  )

  return (
    <>
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Consultas hoje', value: formatPrefeituraNumber(unit.consultationsToday) },
          { label: 'Fila atual', value: String(unit.queueNow) },
          { label: 'Concluídas', value: formatPrefeituraNumber(detail.consultationsCompleted) },
          { label: 'Em andamento', value: String(detail.consultationsInProgress) },
          { label: 'Faltas', value: String(unit.absencesToday) },
          { label: 'Operadores', value: String(detail.operatorsOnline) },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2.5 text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {kpi.label}
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </section>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="h-4 w-4 text-[var(--brand-primary)]" />
            Perfil por gênero
          </h3>
          <ul className="space-y-3">
            {detail.genderStats.map((item) => (
              <li key={item.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800">{item.label}</span>
                  <span className="font-bold tabular-nums text-gray-700">
                    {item.percent}% · {formatPrefeituraNumber(item.count)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-gray-500">
            Taxa de absenteísmo estimada:{' '}
            <span className="font-semibold text-gray-700">{detail.noShowRatePercent}%</span>
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Modalidade de atendimento</h3>
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span>Teleatendimento</span>
              <span>100%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-full rounded-full bg-sky-500" />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Todos os atendimentos desta unidade são realizados por telemedicina.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 px-2 py-2">
              <p className="text-[10px] text-gray-500">Pico do dia</p>
              <p className="text-sm font-bold text-gray-900">{detail.peakHour}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2 py-2">
              <p className="text-[10px] text-gray-500">Duração média</p>
              <p className="text-sm font-bold text-gray-900">{detail.avgConsultationMinutes} min</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mb-4 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">Consultas por especialidade (unidade)</h3>
        <ul className="space-y-2.5">
          {detail.specialties.map((item) => {
            const width = maxSpecialty > 0 ? Math.max(8, (item.count / maxSpecialty) * 100) : 0
            return (
              <li key={item.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-gray-800">{item.label}</span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-gray-600">
                    {formatPrefeituraNumber(item.count)} ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Clock className="h-4 w-4 text-[var(--brand-primary)]" />
            Consultas por hora (hoje)
          </h3>
          <ul className="space-y-1.5">
            {detail.hourlyToday.map((point) => {
              const width = maxHourly > 0 ? Math.max(6, (point.value / maxHourly) * 100) : 0
              return (
                <li key={point.hour} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-[10px] font-semibold text-gray-500">
                    {point.hour}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[10px] font-bold tabular-nums text-gray-700">
                    {point.value}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Composição da fila atual</h3>
          <ul className="space-y-3">
            {detail.queueBreakdown.map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900">{item.label}</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{item.count}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{item.description}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg border border-gray-100 px-2 py-2">
              <p className="text-gray-500">Terminais ativos</p>
              <p className="font-bold text-gray-900">{detail.stationsActive}</p>
            </div>
            <div className="rounded-lg border border-gray-100 px-2 py-2">
              <p className="text-gray-500">Cancelamentos</p>
              <p className="font-bold text-gray-900">{detail.cancellationsToday}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
