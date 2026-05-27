import { useMemo } from 'react'
import {
  adminMunicipalityCatalog,
  type AdminMunicipalPatient,
} from '../../../data/adminPacientesMock'
import { brand } from '../../../config/brand'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

type AdminPacientesAboutPanelProps = {
  patients: AdminMunicipalPatient[]
}

function monthCountMap(patients: AdminMunicipalPatient[]) {
  const labels: AdminMunicipalPatient['registrationMonthLabel'][] = [
    'Dez',
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
  ]
  return labels.map((label) => ({
    label,
    count: patients.filter((patient) => patient.registrationMonthLabel === label).length,
  }))
}

function municipalityCountMap(patients: AdminMunicipalPatient[]) {
  const base = adminMunicipalityCatalog.map((city) => ({
    label: city,
    registrations: 0,
  }))

  const map = patients.reduce((acc, patient) => {
    acc.set(patient.municipality, (acc.get(patient.municipality) ?? 0) + 1)
    return acc
  }, new Map<string, number>())

  return base
    .map((item) => ({ ...item, registrations: map.get(item.label) ?? 0 }))
    .sort((a, b) => b.registrations - a.registrations)
    .slice(0, 10)
}

function contractStatusMap(patients: AdminMunicipalPatient[]) {
  const active = patients.filter((patient) => patient.contractStatus === 'ativo').length
  const ended = patients.length - active
  return [
    { label: 'Municípios com contrato ativo', registrations: active },
    { label: 'Municípios com contrato encerrado', registrations: ended },
  ]
}

function HorizontalBars({
  data,
  gradientClass,
}: {
  data: { label: string; registrations: number }[]
  gradientClass: string
}) {
  const max = Math.max(...data.map((item) => item.registrations), 1)
  return (
    <ul className="space-y-2.5">
      {data.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate font-medium text-gray-600">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
              {formatNumber(item.registrations)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${gradientClass}`}
              style={{ width: `${(item.registrations / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AdminPacientesAboutPanel({ patients }: AdminPacientesAboutPanelProps) {
  const illustrationUrl = brand.dashboardUsersAboutImageUrl
  const monthData = useMemo(() => monthCountMap(patients), [patients])
  const municipalityData = useMemo(() => municipalityCountMap(patients), [patients])
  const contractData = useMemo(() => contractStatusMap(patients), [patients])
  const monthMax = Math.max(...monthData.map((item) => item.count), 1)

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Indicadores da base consolidada</h2>
        </header>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Novos cadastros por mês
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">Últimos 6 meses</p>
            <div className="mt-3 flex items-end justify-between gap-1.5">
              {monthData.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold tabular-nums text-gray-700">
                    {formatNumber(item.count)}
                  </span>
                  <div className="flex h-[100px] w-full items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[var(--brand-primary)] to-orange-400"
                      style={{ height: `${Math.max(12, (item.count / monthMax) * 100)}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cadastros por municípios
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">Top 10 municípios por volume</p>
            <div className="mt-3 min-h-[340px]">
              <HorizontalBars
                data={municipalityData}
                gradientClass="bg-gradient-to-r from-indigo-500 to-sky-400"
              />
            </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Base por status contratual
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">
              Usuários vinculados a municípios com contrato ativo ou encerrado
            </p>
            <div className="mt-3">
              <HorizontalBars
                data={contractData}
                gradientClass="bg-gradient-to-r from-violet-500 to-fuchsia-400"
              />
            </div>
            </section>
          </div>

          {illustrationUrl ? (
            <div className="mt-2 flex shrink-0 items-end pb-1 pt-1">
              <img
                src={illustrationUrl}
                alt=""
                className="h-28 w-full object-contain object-bottom"
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
