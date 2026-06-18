import { Building2, ChevronRight, Eye, Filter, RotateCcw } from 'lucide-react'
import { useEntidadeCopy } from '../../hooks/useEntidadeCopy'
import { useCallback, useMemo } from 'react'
import { usePrefeituraAlertsDrawer } from '../../hooks/usePrefeituraAlertsDrawer'
import { usePrefeituraRegionDrawer } from '../../hooks/usePrefeituraRegionDrawer'
import { usePrefeituraSlaDrawer } from '../../hooks/usePrefeituraSlaDrawer'
import { usePrefeituraUbsDetailDrawer } from '../../hooks/usePrefeituraUbsDetailDrawer'
import { usePrefeituraSpecialtyDrawer } from '../../hooks/usePrefeituraSpecialtyDrawer'
import { usePrefeituraDashboardPage } from '../../hooks/usePrefeituraDashboardPage'
import { CustomSelect } from '../ui/CustomSelect'
import { KpiStatCards } from '../ui/KpiStatCards'
import { SituationStatusBadge } from '../ui/SituationStatusBadge'
import { buildPrefeituraDashboardFilterSummary } from '../../utils/prefeituraDashboardFilters'
import { AdminTriageChartsSection } from '../admin/dashboard/AdminTriageChartsSection'
import { PrefeituraAlertsPanel } from './PrefeituraAlertsPanel'
import { PrefeituraConsultationPackagePanel } from './PrefeituraConsultationPackagePanel'
import { PrefeituraHourlyChart } from './PrefeituraHourlyChart'
import { PrefeituraRegionBars } from './PrefeituraRegionBars'
import { PrefeituraPosConsultaKpiSection } from './PrefeituraPosConsultaKpiSection'
import { PrefeituraSlaPanel } from './PrefeituraSlaPanel'
import { PrefeituraSpecialtyBreakdown } from './PrefeituraSpecialtyBreakdown'
import { PrefeituraDashboardMainPanelSkeleton } from './skeletons/PrefeituraDashboardMainPanelSkeleton'
import { prefeituraDashboardCardsRowClass } from '../layout/dashboardPageLayout'
import {
  DashCard,
  DashLinkAction,
  DashLiveBadge,
  formatPrefeituraNumber,
  prefDashboardHourlyAlertsBodyClass,
  prefDashboardRegionSlaBodyClass,
  prefDashboardSpecialtyBodyClass,
  prefDashboardRegionBodyClass,
  prefeituraSlaBadgeConfig,
} from './prefeituraDashboardUi'

export function PrefeituraDashboardMainPanel() {
  const copy = useEntidadeCopy()
  const {
    period,
    setPeriod,
    region,
    setRegion,
    ubt,
    setUbt,
    dashboard,
    isLoading,
    loadError,
    ubtFilterOptions,
    loadUnitDetail,
    filterOptions,
  } = usePrefeituraDashboardPage()

  function handleClearFilters() {
    setPeriod('hoje')
    setRegion('todas')
    setUbt('todas')
  }

  const alertsDrawer = usePrefeituraAlertsDrawer()
  const specialtyDrawer = usePrefeituraSpecialtyDrawer()
  const regionDrawer = usePrefeituraRegionDrawer()
  const slaDrawer = usePrefeituraSlaDrawer()
  const exportFilterSummary = useMemo(
    () => buildPrefeituraDashboardFilterSummary({ period, region, ubt }, filterOptions),
    [period, region, ubt, filterOptions],
  )
  const ubsDetailDrawer = usePrefeituraUbsDetailDrawer({
    filterSummaryLines: exportFilterSummary,
    loadUnitDetail,
  })

  const handleOpenAllAlerts = useCallback(() => {
    if (!dashboard) return
    alertsDrawer.openDrawer(dashboard.allAlerts)
  }, [alertsDrawer, dashboard])

  const handleOpenAllSpecialties = useCallback(() => {
    if (!dashboard) return
    specialtyDrawer.openDrawer({
      specialties: dashboard.specialties,
      total: dashboard.specialtyTotal,
    })
  }, [specialtyDrawer, dashboard])

  const handleOpenRegionReport = useCallback(() => {
    if (!dashboard) return
    regionDrawer.openDrawer({
      regions: dashboard.regions,
      ubsRows: dashboard.ubsRows,
    })
  }, [regionDrawer, dashboard])

  const handleOpenAllSla = useCallback(() => {
    if (!dashboard) return
    slaDrawer.openDrawer({ ubsRows: dashboard.ubsRows })
  }, [slaDrawer, dashboard])

  if (isLoading && !dashboard) {
    return <PrefeituraDashboardMainPanelSkeleton />
  }

  if (loadError && !dashboard) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50/80 p-5">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-slate-50/80">
      <div className="w-full space-y-4 py-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              {copy.portal}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Visão consolidada da rede de teleatendimento
            </h1>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <DashLiveBadge />
          </div>
        </header>

        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900">
              <Filter className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
              Filtros da rede
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-[var(--brand-primary)]"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              Limpar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Período</label>
              <CustomSelect
                value={period}
                onChange={setPeriod}
                options={filterOptions.period}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Região administrativa
              </label>
              <CustomSelect
                value={region}
                onChange={setRegion}
                options={filterOptions.region}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">UBT</label>
              <CustomSelect
                value={ubt}
                onChange={setUbt}
                options={ubtFilterOptions}
              />
            </div>
          </div>
        </section>

        <KpiStatCards
          items={dashboard.kpiCards}
          updateKey={dashboard.filterKey}
          className="gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
          animated
        />

        <div className="grid gap-4 xl:grid-cols-12">
          <section
            className={[prefeituraDashboardCardsRowClass, 'lg:col-span-12 lg:grid-cols-12'].join(
              ' ',
            )}
          >
            <DashCard
              fillHeight
              className="h-full lg:col-span-5"
              title="Consultas por hora"
              subtitle="Volume agregado da rede no período"
              bodyClassName={[prefDashboardHourlyAlertsBodyClass, 'px-2 pb-2 pt-0.5'].join(' ')}
            >
              <PrefeituraHourlyChart
                data={dashboard.hourly}
                animationKey={dashboard.filterKey}
              />
            </DashCard>

            <div
              className={[
                prefeituraDashboardCardsRowClass,
                'sm:grid-cols-2 lg:col-span-7',
              ].join(' ')}
            >
              <PrefeituraAlertsPanel
                className="h-full"
                alerts={dashboard.alerts}
                totalCount={dashboard.allAlerts.length}
                onOpenAll={handleOpenAllAlerts}
              />

              <PrefeituraConsultationPackagePanel
                className="h-full"
                usage={dashboard.packageUsage}
                animationKey={dashboard.filterKey}
              />
            </div>
          </section>

          <section
            className={[prefeituraDashboardCardsRowClass, 'lg:col-span-12 lg:grid-cols-12'].join(
              ' ',
            )}
          >
            <DashCard
              fillHeight
              className="h-full lg:col-span-5"
              title="Consultas por especialidade"
              subtitle="Distribuição no recorte"
              bodyClassName={prefDashboardSpecialtyBodyClass}
              action={
                <DashLinkAction onClick={handleOpenAllSpecialties}>
                  Ver todas
                  <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
                </DashLinkAction>
              }
            >
              <PrefeituraSpecialtyBreakdown
                stats={dashboard.specialties}
                total={dashboard.specialtyTotal}
                animationKey={dashboard.filterKey}
              />
            </DashCard>

            <div
              className={[
                prefeituraDashboardCardsRowClass,
                'sm:grid-cols-2 lg:col-span-7',
              ].join(' ')}
            >
              <DashCard
                fillHeight
                className="h-full"
                title="Consultas por região"
                subtitle="Distribuição por RA / bairro"
                bodyClassName={prefDashboardRegionBodyClass}
                action={
                  <DashLinkAction onClick={handleOpenRegionReport}>
                    Ver todas
                    <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
                  </DashLinkAction>
                }
              >
                <PrefeituraRegionBars
                  regions={dashboard.regions}
                  animationKey={dashboard.filterKey}
                />
              </DashCard>

              <PrefeituraSlaPanel
                className="h-full"
                rows={dashboard.slaRows}
                animationKey={dashboard.filterKey}
                onOpenAll={handleOpenAllSla}
              />
            </div>
          </section>

          <AdminTriageChartsSection
            data={dashboard.triageCharts}
            animationKey={dashboard.filterKey}
            periodLabel={
              filterOptions.period.find((option) => option.value === period)?.label ??
              'Período selecionado'
            }
            sectionLabel="Saúde da população"
            title={`Triagem clínica ${copy.daRede}`}
            scopeHint="somente pacientes da sua prefeitura"
          />

          <PrefeituraPosConsultaKpiSection
            period={period}
            region={region}
            ubt={ubt}
            filterKey={dashboard.filterKey}
            periodLabel={
              filterOptions.period.find((option) => option.value === period)?.label ??
              'Período selecionado'
            }
          />

          <DashCard
            className="w-full xl:col-span-12"
            title="Unidades básicas de teleatendimento"
            subtitle="Monitoramento operacional"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3">Região</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-center">Consultas</th>
                    <th className="px-4 py-3 text-center">Fila</th>
                    <th className="px-4 py-3 text-center">Espera</th>
                    <th className="px-4 py-3 text-center">Faltas</th>
                    <th className="px-4 py-3 text-center">SLA</th>
                    <th className="px-4 py-3 text-center">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboard.ubsRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                        Nenhuma UBT corresponde aos filtros selecionados
                      </td>
                    </tr>
                  ) : null}
                  {dashboard.ubsRows.map((row) => (
                    <tr key={row.id} className="text-gray-800 transition hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold text-gray-900">
                          <Building2
                            className="h-4 w-4 shrink-0 text-gray-400"
                            strokeWidth={1.75}
                          />
                          {row.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.region}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.type}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                        {formatPrefeituraNumber(row.consultationsToday)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                        {row.queueNow}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold">
                        {row.avgWait}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                        {row.absencesToday}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <SituationStatusBadge
                            config={prefeituraSlaBadgeConfig[row.sla]}
                            widthClass="w-[5.5rem]"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => ubsDetailDrawer.openDrawer(row)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                            aria-label={`Ver detalhes de ${row.name}`}
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashCard>
        </div>
      </div>

      {alertsDrawer.drawerElement}
      {specialtyDrawer.drawerElement}
      {regionDrawer.drawerElement}
      {slaDrawer.drawerElement}
      {ubsDetailDrawer.drawerElement}
    </div>
  )
}
