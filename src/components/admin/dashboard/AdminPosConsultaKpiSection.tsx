import { useEffect, useMemo, useState } from 'react'
import { Building2, HeartPulse, ShieldCheck } from 'lucide-react'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  fetchAdminPosConsultaDashboard,
  isAdminPosConsultaDashboardApiError,
  mapAdminPosConsultaDashboardToKpiCards,
} from '../../../lib/services/admin/posConsultaDashboard'
import type { AdminPosConsultaDashboardView } from '../../../types/adminPosConsultaDashboard'
import { DashCard, formatPrefeituraNumber } from '../../prefeitura/prefeituraDashboardUi'
import { KpiStatCards } from '../../ui/KpiStatCards'
import {
  AdminDashboardHorizontalBarChart,
  withBarGradients,
  type AdminDashboardBarChartItem,
} from './AdminDashboardBarCharts'
import { CredentialDonutChart } from '../../credenciais/CredentialDonutChart'
import { AdminPosConsultaKpiSectionSkeleton } from './skeletons/AdminPosConsultaKpiSectionSkeleton'

const EVOLUCAO_CHART_COLORS: Record<string, { gradientFrom: string; gradientTo: string }> = {
  melhorou: { gradientFrom: '#10b981', gradientTo: '#059669' },
  igual: { gradientFrom: '#0ea5e9', gradientTo: '#2563eb' },
  piorou: { gradientFrom: '#f43f5e', gradientTo: '#e11d48' },
}

type AdminPosConsultaKpiSectionProps = {
  period: string
  state: string
  city: string
  contract: string
  filterKey: string
  periodLabel: string
}

function buildPeriodHint(periodLabel: string): string {
  if (periodLabel === 'Hoje') return 'hoje'
  if (periodLabel === 'Últimos 7 dias') return 'últimos 7 dias'
  if (periodLabel === 'Últimos 30 dias') return 'últimos 30 dias'
  return periodLabel.toLowerCase()
}

function buildCardSubtitle(periodLabel: string, view: AdminPosConsultaDashboardView): string {
  const periodHint = buildPeriodHint(periodLabel)
  const clientCount = view.clientesBreakdown.length
  const clientHint =
    clientCount === 1 ? '1 município no recorte' : `${clientCount} municípios no recorte`
  return `${formatPrefeituraNumber(view.kpis.acompanhamentosAtivos)} planos ativos · ${clientHint} · ${periodHint}`
}

export function AdminPosConsultaKpiSection({
  period,
  state,
  city,
  contract,
  filterKey,
  periodLabel,
}: AdminPosConsultaKpiSectionProps) {
  const { getAccessToken } = useAdminAuth()
  const [data, setData] = useState<AdminPosConsultaDashboardView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      setError('Sessão expirada.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchAdminPosConsultaDashboard(token, {
      period,
      state,
      city,
      contract,
    })
      .then((response) => {
        if (cancelled) return
        setData(response)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          isAdminPosConsultaDashboardApiError(err)
            ? err.message
            : 'Não foi possível carregar o acompanhamento pós-consulta.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [getAccessToken, period, state, city, contract])

  const kpiCards = useMemo(
    () => (data ? mapAdminPosConsultaDashboardToKpiCards(data) : []),
    [data],
  )

  const animationKey = data?.filterKey ?? filterKey

  const evolucaoBarItems = useMemo((): AdminDashboardBarChartItem[] => {
    if (!data) return []
    return data.evolucaoDistribuicao.map((item) => {
      const colors = EVOLUCAO_CHART_COLORS[item.key]
      return {
        key: item.key,
        label: item.label,
        count: item.count,
        gradientFrom: colors?.gradientFrom ?? '#94a3b8',
        gradientTo: colors?.gradientTo ?? '#64748b',
      }
    })
  }, [data])

  const clientBarItems = useMemo((): AdminDashboardBarChartItem[] => {
    if (!data) return []
    return withBarGradients(
      data.clientesBreakdown.map((row) => ({
        key: row.clientId,
        label: `${row.municipalityName}/${row.stateUf}`,
        count: row.acompanhamentosAtivos,
      })),
    )
  }, [data])

  const evolucaoTotal = data?.evolucaoDistribuicao.reduce((sum, item) => sum + item.count, 0) ?? 0
  const melhorouPercent =
    data?.evolucaoDistribuicao.find((item) => item.key === 'melhorou')?.percent ?? 0

  if (loading && !data) {
    return <AdminPosConsultaKpiSectionSkeleton />
  }

  if (error && !data) {
    return (
      <section className="min-w-0 xl:col-span-12">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </section>
    )
  }

  if (!data) return null

  return (
    <section className="min-w-0 xl:col-span-12">
      <DashCard
        title="Acompanhamento pós-consulta"
        subtitle={buildCardSubtitle(periodLabel, data)}
        action={
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
            <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
            LGPD · visão agregada
          </span>
        }
        bodyClassName="space-y-5 p-4 sm:p-5"
      >
        <KpiStatCards
          items={kpiCards}
          updateKey={animationKey}
          variant="centered"
          className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          animated
        />

        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-slate-50/90 via-white to-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                Evolução reportada
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                Como os pacientes avaliaram a evolução nos check-ins respondidos (rede inteira)
              </p>
            </div>
            {evolucaoTotal > 0 ? (
              <p className="text-right text-xs text-gray-500">
                <span className="block text-lg font-bold tabular-nums text-gray-900">
                  {formatPrefeituraNumber(evolucaoTotal)}
                </span>
                respostas no recorte
              </p>
            ) : null}
          </div>

          {evolucaoTotal === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
              Nenhum check-in respondido no recorte selecionado.
            </p>
          ) : (
            <div className="mt-5 grid items-center gap-6 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
              <div className="flex justify-center sm:justify-start">
                <CredentialDonutChart
                  chartId={`admin-pos-consulta-evolucao-${animationKey}`}
                  size="lg"
                  centerPrimary={`${melhorouPercent}%`}
                  centerSecondary="melhorou"
                  slices={data.evolucaoDistribuicao.map((item) => ({
                    key: item.key,
                    label: item.label,
                    count: item.count,
                    gradientFrom: EVOLUCAO_CHART_COLORS[item.key]?.gradientFrom ?? '#94a3b8',
                    gradientTo: EVOLUCAO_CHART_COLORS[item.key]?.gradientTo ?? '#64748b',
                  }))}
                />
              </div>

              <div className="flex min-h-[9rem] flex-col justify-center">
                <AdminDashboardHorizontalBarChart
                  items={evolucaoBarItems}
                  animationKey={animationKey}
                  maxItems={3}
                  emptyMessage="Sem dados de evolução"
                />
              </div>
            </div>
          )}

          <p className="mt-4 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
            <HeartPulse className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
            Continuidade do cuidado além da consulta pontual — indicadores consolidados por contrato.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-slate-50/90 via-white to-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                Por município / cliente
              </p>
              <p className="mt-0.5 text-sm text-gray-600">
                Comparativo de acompanhamentos ativos e adesão por contrato no recorte
              </p>
            </div>
            <Building2 className="h-5 w-5 text-gray-400" strokeWidth={2} />
          </div>

          {data.clientesBreakdown.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
              Nenhum município corresponde aos filtros selecionados.
            </p>
          ) : (
            <>
              <div className="mt-5">
                <AdminDashboardHorizontalBarChart
                  items={clientBarItems}
                  animationKey={`${animationKey}-clientes`}
                  maxItems={8}
                  emptyMessage="Sem municípios no recorte"
                />
              </div>

              <div className="mt-5 overflow-x-auto rounded-lg border border-gray-100 bg-white">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Município</th>
                      <th className="px-4 py-3 text-center">Ativos</th>
                      <th className="px-4 py-3 text-center">Adesão</th>
                      <th className="px-4 py-3 text-center">Check-ins</th>
                      <th className="px-4 py-3 text-center">Melhora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.clientesBreakdown.map((row) => (
                      <tr key={row.clientId} className="text-gray-700">
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {row.municipalityName}
                          <span className="ml-1.5 text-xs font-normal text-gray-500">{row.stateUf}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums">
                          {formatPrefeituraNumber(row.acompanhamentosAtivos)}
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{row.taxaAdesaoPercent}%</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">
                          {formatPrefeituraNumber(row.checkinsRealizados)}
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{row.taxaMelhoraPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </DashCard>
    </section>
  )
}
