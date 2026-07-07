import { RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import {
  AdminDashboardHorizontalBarChart,
  AdminDashboardVerticalBarChart,
  withBarGradients,
} from '../../admin/dashboard/AdminDashboardBarCharts'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  prefeituraDashboardCardsRowClass,
} from '../../layout/dashboardPageLayout'
import { CustomSelect } from '../../ui/CustomSelect'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { buildCrmPartnersMonthOptions } from '../../../data/crmPartnersDashboardMock'
import { useCrmPartnersDashboardPage } from '../../../hooks/useCrmPartnersDashboardPage'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function withPercent(items: Array<{ key: string; label: string; count: number }>) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }))
}

export function CrmPartnersDashboardMainPanel() {
  const {
    startMonth,
    endMonth,
    setStartMonth,
    setEndMonth,
    resetRange,
    dashboard,
  } = useCrmPartnersDashboardPage()

  const monthOptions = useMemo(() => buildCrmPartnersMonthOptions(24), [])

  const clientsChartItems = useMemo(
    () => withBarGradients(withPercent(dashboard.clientsByType)),
    [dashboard.clientsByType],
  )

  const trendChartItems = useMemo(
    () => withBarGradients(withPercent(dashboard.referredClientsTrend)),
    [dashboard.referredClientsTrend],
  )

  const commissionsPaidItems = useMemo(
    () =>
      withBarGradients(
        withPercent(
          dashboard.commissionsByMonth.map((item) => ({
            key: `${item.key}-paid`,
            label: item.label,
            count: item.paid,
          })),
        ),
      ),
    [dashboard.commissionsByMonth],
  )

  const commissionsPendingItems = useMemo(
    () =>
      withBarGradients(
        withPercent(
          dashboard.commissionsByMonth.map((item) => ({
            key: `${item.key}-pending`,
            label: item.label,
            count: item.pending,
          })),
        ),
      ),
    [dashboard.commissionsByMonth],
  )

  return (
    <div className={dashboardPageScrollAreaClass}>
      <div className={[dashboardPageScrollPaddingClass, 'w-full space-y-4 pt-5 sm:pt-6'].join(' ')}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              CRM Partners
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Visão geral comercial
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Indicadores consolidados para {dashboard.periodLabel}.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[9.5rem] flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-gray-600">Mês inicial</span>
              <CustomSelect
                size="compact"
                value={startMonth}
                onChange={(value) => setStartMonth(value as typeof startMonth)}
                options={monthOptions}
              />
            </label>
            <label className="min-w-[9.5rem] flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-gray-600">Mês final</span>
              <CustomSelect
                size="compact"
                value={endMonth}
                onChange={(value) => setEndMonth(value as typeof endMonth)}
                options={monthOptions}
              />
            </label>
            <button
              type="button"
              onClick={resetRange}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              Mês atual
            </button>
          </div>
        </section>

        <KpiStatCards
          items={dashboard.kpiCards}
          updateKey={dashboard.filterKey}
          className="gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
          animated
        />

        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-sky-900">
          <span className="font-semibold">Clientes indicados por tipo:</span>{' '}
          Prefeitura {dashboard.clientsBreakdown.prefeitura} · Santa Casa{' '}
          {dashboard.clientsBreakdown.santaCasa} · Empresa {dashboard.clientsBreakdown.empresa}
        </div>

        <div className={prefeituraDashboardCardsRowClass}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DashCard title="Clientes por tipo" subtitle="Distribuição no período selecionado" fillHeight>
              <AdminDashboardHorizontalBarChart
                items={clientsChartItems}
                animationKey={`${dashboard.filterKey}-clients-type`}
                maxItems={3}
              />
            </DashCard>

            <DashCard
              title="Indicações por mês"
              subtitle="Volume de clientes indicados"
              fillHeight
            >
              <AdminDashboardVerticalBarChart
                items={trendChartItems}
                animationKey={`${dashboard.filterKey}-clients-trend`}
              />
            </DashCard>
          </div>
        </div>

        <div className={prefeituraDashboardCardsRowClass}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DashCard title="Comissões pagas" subtitle="Por mês no recorte" fillHeight>
              <AdminDashboardVerticalBarChart
                items={commissionsPaidItems}
                animationKey={`${dashboard.filterKey}-paid`}
              />
            </DashCard>

            <DashCard title="Comissões a pagar" subtitle="Por mês no recorte" fillHeight>
              <AdminDashboardVerticalBarChart
                items={commissionsPendingItems}
                animationKey={`${dashboard.filterKey}-pending`}
              />
            </DashCard>
          </div>
        </div>

        <DashCard
          title="Resumo financeiro do período"
          subtitle="Totais consolidados no recorte mensal"
        >
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Comissões pagas</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">
                {formatCurrency(
                  dashboard.commissionsByMonth.reduce((sum, item) => sum + item.paid, 0),
                )}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Comissões a pagar</p>
              <p className="mt-1 text-lg font-bold text-amber-700">
                {formatCurrency(
                  dashboard.commissionsByMonth.reduce((sum, item) => sum + item.pending, 0),
                )}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Ticket médio</p>
              <p className="mt-1 text-lg font-bold text-violet-700">
                {dashboard.kpiCards[4]?.value ?? '—'}
              </p>
            </div>
          </div>
        </DashCard>
      </div>
    </div>
  )
}
