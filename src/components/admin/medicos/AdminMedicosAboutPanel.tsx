import { useMemo } from 'react'
import type { AdminDoctor } from '../../../types/adminMedicos'
import type { AtivosSummaryResponse } from '../../../lib/mockServices/admin/profissionaisAtivos'

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

type BarSlice = { label: string; count: number }

function HorizontalBars({
  data,
  gradientClass,
}: {
  data: BarSlice[]
  gradientClass: string
}) {
  const max = Math.max(...data.map((item) => item.count), 1)
  return (
    <ul className="space-y-2.5">
      {data.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate font-medium text-gray-600">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
              {formatNumber(item.count)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${gradientClass}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function buildSpecialtySlices(doctors: AdminDoctor[]): BarSlice[] {
  const map = new Map<string, number>()
  doctors.forEach((doctor) => {
    const label = doctor.specialty.trim() || 'Sem especialidade'
    map.set(label, (map.get(label) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function buildAllocationSlices(doctors: AdminDoctor[]): BarSlice[] {
  const national = doctors.filter((doctor) => doctor.allocation === 'nacional').length
  const contract = doctors.length - national
  return [
    { label: 'Nacional', count: national },
    { label: 'Por contrato', count: contract },
  ]
}

type AdminMedicosAboutPanelProps = {
  doctors?: AdminDoctor[]
  ativosSummary?: AtivosSummaryResponse | null
}

export function AdminMedicosAboutPanel({
  doctors = [],
  ativosSummary,
}: AdminMedicosAboutPanelProps) {
  const summary = useMemo(
    () => ({
      totalDoctors: ativosSummary?.ativos ?? doctors.filter((doctor) => doctor.status === 'ativo').length,
      onlineNow: ativosSummary?.online ?? doctors.filter((doctor) => doctor.isOnlineNow).length,
      emPlantao: ativosSummary?.emPlantao ?? 0,
      avgRating:
        ativosSummary?.averageRating ??
        doctors.reduce((sum, doctor) => sum + doctor.averageRating, 0) /
          Math.max(1, doctors.length),
      totalReviews: doctors.reduce((sum, doctor) => sum + doctor.totalReviews, 0),
    }),
    [ativosSummary, doctors],
  )

  const specialtySlices = useMemo(() => buildSpecialtySlices(doctors), [doctors])
  const allocationSlices = useMemo(() => buildAllocationSlices(doctors), [doctors])
  const illustrationUrl = `${import.meta.env.BASE_URL}doctors.png`

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Indicadores da base de profissionais</h2>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 text-xs">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Profissionais cadastrados
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatNumber(summary.totalDoctors)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Online agora
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatNumber(summary.onlineNow)}
              <span className="ml-1.5 text-xs font-medium text-gray-500">
                de {formatNumber(summary.totalDoctors)}
              </span>
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-emerald-700">
              {formatNumber(summary.emPlantao)} em plantão
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Nota média
            </p>
            <p className="mt-1 text-xl font-bold text-amber-600">
              {formatNumber(summary.avgRating, 1)}
              <span className="ml-1.5 text-xs font-medium text-gray-500">/ 5</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Avaliações
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatNumber(summary.totalReviews)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Especialidades mais ativas
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Top 10 por número de profissionais</p>
              <div className="mt-3">
                {specialtySlices.length > 0 ? (
                  <HorizontalBars
                    data={specialtySlices}
                    gradientClass="bg-gradient-to-r from-sky-500 to-indigo-500"
                  />
                ) : (
                  <p className="text-xs text-gray-500">Nenhum profissional cadastrado ainda.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Alocação na plataforma
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">
                Distribuição entre contratos municipais e escala nacional
              </p>
              <div className="mt-3">
                {doctors.length > 0 ? (
                  <HorizontalBars
                    data={allocationSlices}
                    gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                  />
                ) : (
                  <p className="text-xs text-gray-500">Nenhum profissional cadastrado ainda.</p>
                )}
              </div>
            </section>
          </div>

          {illustrationUrl ? (
            <div className="mt-2 flex shrink-0 items-end pb-1 pt-1">
              <img
                src={illustrationUrl}
                alt=""
                className="h-36 w-full object-contain object-bottom"
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
