import { useMemo } from 'react'
import type { AdminProfissionalCandidatura } from '../../../types/adminProfissionais'
import type { CandidaturasSummaryResponse } from '../../../lib/mockServices/admin/profissionais'
import type { AtivosSummaryResponse } from '../../../lib/mockServices/admin/profissionaisAtivos'
import {
  adminCandidaturaStatusBadgeConfig,
  countPendingDocuments,
  formatAdminProfissionaisNumber,
} from './adminProfissionaisUi'

type AdminProfissionaisCandidaturasAboutPanelProps = {
  candidaturas: AdminProfissionalCandidatura[]
  candidaturasSummary: CandidaturasSummaryResponse | null
  ativosSummary: AtivosSummaryResponse | null
}

type BarSlice = { label: string; count: number }

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function buildStatusSlices(rows: AdminProfissionalCandidatura[]): BarSlice[] {
  const order = ['pendente', 'em_analise', 'incompleto', 'aprovado', 'reprovado'] as const
  const map = new Map<string, number>()
  rows.forEach((row) => map.set(row.status, (map.get(row.status) ?? 0) + 1))
  return order
    .map((status) => ({
      label: adminCandidaturaStatusBadgeConfig[status].label,
      count: map.get(status) ?? 0,
    }))
    .filter((item) => item.count > 0)
}

function buildCountSlices(
  rows: AdminProfissionalCandidatura[],
  getKey: (row: AdminProfissionalCandidatura) => string,
  limit = 8,
): BarSlice[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = getKey(row)
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function buildMonthSlices(rows: AdminProfissionalCandidatura[]): BarSlice[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const match = row.submittedAtLabel.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (!match) return
    const [, , month, year] = match
    const label = `${month}/${year.slice(2)}`
    map.set(label, (map.get(label) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const [am, ay] = a.label.split('/').map(Number)
      const [bm, by] = b.label.split('/').map(Number)
      return ay !== by ? ay - by : am - bm
    })
    .slice(-6)
}

function HorizontalBars({
  data,
  gradientClass,
}: {
  data: BarSlice[]
  gradientClass: string
}) {
  if (data.length === 0) {
    return <p className="text-xs text-gray-500">Sem dados para exibir.</p>
  }

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

export function AdminProfissionaisCandidaturasAboutPanel({
  candidaturas,
  candidaturasSummary,
  ativosSummary,
}: AdminProfissionaisCandidaturasAboutPanelProps) {
  const total = candidaturasSummary?.total ?? candidaturas.length
  const pendingReview =
    (candidaturasSummary?.pendente ?? 0) +
    (candidaturasSummary?.em_analise ?? 0) +
    (candidaturasSummary?.incompleto ?? 0)
  const approvedCandidaturas = candidaturasSummary?.aprovado ?? 0
  const activeDoctorsCount = ativosSummary?.ativos ?? 0
  const activeDoctorsOnline = ativosSummary?.online ?? 0
  const avgPendingDocs = useMemo(() => {
    if (total === 0) return 0
    const sum = candidaturas.reduce(
      (acc, row) => acc + countPendingDocuments(row.documents),
      0,
    )
    return sum / total
  }, [candidaturas, total])

  const statusSlices = useMemo(() => buildStatusSlices(candidaturas), [candidaturas])
  const formationSlices = useMemo(
    () => buildCountSlices(candidaturas, (row) => row.formationLabel, 6),
    [candidaturas],
  )
  const ufSlices = useMemo(
    () => buildCountSlices(candidaturas, (row) => row.councilUf, 6),
    [candidaturas],
  )
  const monthData = useMemo(() => buildMonthSlices(candidaturas), [candidaturas])
  const monthMax = Math.max(...monthData.map((item) => item.count), 1)

  const funnelSlices = useMemo(
    () =>
      [
        { label: 'Candidaturas', count: total },
        { label: 'Aguardando análise', count: pendingReview },
        { label: 'Aprovadas', count: approvedCandidaturas },
        { label: 'Ativos na plataforma', count: activeDoctorsCount },
      ].filter((item) => item.count > 0),
    [total, pendingReview, approvedCandidaturas, activeDoctorsCount],
  )

  const illustrationUrl = `${import.meta.env.BASE_URL}doctors.png`

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Indicadores de profissionais</h2>
          <p className="mt-1 text-xs text-gray-500">Candidaturas, base ativa e distribuição</p>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 text-xs">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Candidaturas
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(total)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Aguardando análise
            </p>
            <p className="mt-1 text-xl font-bold text-orange-600">{formatNumber(pendingReview)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Profissionais ativos
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatNumber(activeDoctorsCount)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Online agora
            </p>
            <p className="mt-1 text-xl font-bold text-sky-600">
              {formatNumber(activeDoctorsOnline)}
              <span className="ml-1 text-xs font-medium text-gray-500">
                de {formatNumber(activeDoctorsCount)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-center text-xs">
          <p className="font-semibold text-gray-700">
            Média de {formatAdminProfissionaisNumber(Math.round(avgPendingDocs * 10) / 10)}{' '}
            documento(s) pendente(s) por candidatura
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {approvedCandidaturas} aprovada(s) aguardando ou concluindo finalização
          </p>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Funil de profissionais
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">
                Da candidatura ao profissional ativo na plataforma
              </p>
              <div className="mt-3">
                <HorizontalBars
                  data={funnelSlices}
                  gradientClass="bg-gradient-to-r from-[var(--brand-primary)] to-orange-400"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Candidaturas por status
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Situação atual da fila</p>
              <div className="mt-3">
                <HorizontalBars
                  data={statusSlices}
                  gradientClass="bg-gradient-to-r from-sky-500 to-indigo-500"
                />
              </div>
            </section>

            {monthData.length > 0 ? (
              <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Entradas por mês
                </h3>
                <p className="mt-1 text-[11px] text-gray-500">Candidaturas recebidas</p>
                <div className="mt-3 flex items-end justify-between gap-1.5">
                  {monthData.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold tabular-nums text-gray-700">
                        {formatNumber(item.count)}
                      </span>
                      <div className="flex h-[88px] w-full items-end justify-center">
                        <div
                          className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[var(--brand-primary)] to-orange-400"
                          style={{
                            height: `${Math.max(10, (item.count / monthMax) * 88)}px`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Por profissão
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Formação declarada na candidatura</p>
              <div className="mt-3">
                <HorizontalBars
                  data={formationSlices}
                  gradientClass="bg-gradient-to-r from-violet-500 to-purple-500"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Por UF do conselho
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">Distribuição geográfica</p>
              <div className="mt-3">
                <HorizontalBars
                  data={ufSlices}
                  gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                />
              </div>
            </section>
          </div>

          {illustrationUrl ? (
            <div className="mt-2 flex shrink-0 items-end pb-1 pt-1">
              <img
                src={illustrationUrl}
                alt=""
                className="h-32 w-full object-contain object-bottom"
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
