import { Filter, RotateCcw } from 'lucide-react'
import { useCallback } from 'react'
import { useAdminDashboardPage } from '../../../hooks/useAdminDashboardPage'
import { useAdminKpiDrillDrawer } from '../../../hooks/useAdminKpiDrillDrawer'
import { useAdminMunicipalityDrawer } from '../../../hooks/useAdminMunicipalityDrawer'
import { useAdminNocDrawer } from '../../../hooks/useAdminNocDrawer'
import { adminDashboardFilterOptions } from '../../../types/adminDashboard'
import {
  buildAdminKpiDrillRows,
  kpiIndexToDrillKind,
} from '../../../utils/adminDashboardFilters'
import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  prefeituraDashboardCardsRowClass,
} from '../../layout/dashboardPageLayout'
import { CustomSelect } from '../../ui/CustomSelect'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { DashLiveBadge } from '../../prefeitura/prefeituraDashboardUi'
import { AdminHourlyChartPanel } from './AdminHourlyChartPanel'
import { AdminOperationalSummaryPanel } from './AdminOperationalSummaryPanel'
import { AdminMunicipalitiesTable } from './AdminMunicipalitiesTable'
import { AdminNocCentralPanel } from './AdminNocCentralPanel'
import { AdminPlatformPackagePanel } from './AdminPlatformPackagePanel'
import { AdminRevenuePanel } from './AdminRevenuePanel'
import { AdminTerminalsPanel } from './AdminTerminalsPanel'
import { AdminTriageChartsSection } from './AdminTriageChartsSection'
import { AdminDashboardMainPanelSkeleton } from './skeletons/AdminDashboardMainPanelSkeleton'
import { adminDashboardTopRowSectionClass } from './adminDashboardUi'

export function AdminDashboardMainPanel() {
  const {
    dashboard,
    filters,
    isLoading,
    loadError,
    reload,
    setPeriod,
    setState,
    setCity,
    setContract,
    setHealth,
  } = useAdminDashboardPage()

  const nocDrawer = useAdminNocDrawer()
  const municipalityDrawer = useAdminMunicipalityDrawer()
  const kpiDrillDrawer = useAdminKpiDrillDrawer()

  const filterOptions = dashboard?.filterOptions ?? adminDashboardFilterOptions

  const handleClearFilters = useCallback(() => {
    setPeriod('hoje')
    setState('all')
    setCity('all')
    setContract('all')
    setHealth('all')
  }, [setPeriod, setState, setCity, setContract, setHealth])

  const handleOpenNocCentral = useCallback(() => {
    if (!dashboard) return
    nocDrawer.openDrawer(dashboard.nocIncidents)
  }, [nocDrawer, dashboard])

  const handleKpiClick = useCallback(
    (index: number) => {
      if (!dashboard) return
      const kind = kpiIndexToDrillKind(index)
      kpiDrillDrawer.openDrawer(kind, buildAdminKpiDrillRows(kind, dashboard))
    },
    [kpiDrillDrawer, dashboard],
  )

  const openKpiDrill = useCallback(
    (kind: ReturnType<typeof kpiIndexToDrillKind>) => {
      if (!dashboard) return
      kpiDrillDrawer.openDrawer(kind, buildAdminKpiDrillRows(kind, dashboard))
    },
    [kpiDrillDrawer, dashboard],
  )

  if (isLoading && !dashboard) {
    return <AdminDashboardMainPanelSkeleton />
  }

  if (loadError && !dashboard) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto bg-slate-50/80 p-8">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className={dashboardPageScrollAreaClass} aria-busy={isLoading}>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          'w-full space-y-4 pt-5 sm:pt-6',
        ].join(' ')}
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Painel administrativo
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Visão consolidada da plataforma Telefarmed
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              KPIs de todos os contratos, central de incidentes e semáforo dos municípios.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <DashLiveBadge />
          </div>
        </header>

        {loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900">
              <Filter className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
              Filtros da plataforma
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Período</label>
              <CustomSelect
                value={filters.period}
                onChange={setPeriod}
                options={filterOptions.period}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Estado</label>
              <CustomSelect
                value={filters.state}
                onChange={setState}
                options={filterOptions.state}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Cidade</label>
              <CustomSelect
                value={filters.city ?? 'all'}
                onChange={setCity}
                options={filterOptions.city ?? adminDashboardFilterOptions.city}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Contrato</label>
              <CustomSelect
                value={filters.contract}
                onChange={setContract}
                options={filterOptions.contract}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Semáforo</label>
              <CustomSelect
                value={filters.health}
                onChange={setHealth}
                options={filterOptions.health}
              />
            </div>
          </div>
        </section>

        <KpiStatCards
          items={dashboard.kpiCards}
          updateKey={dashboard.filterKey}
          layout="grid-1x6"
          animated
          onItemClick={handleKpiClick}
        />

        <div className="grid gap-4 xl:grid-cols-12">
          <section
            className={[
              prefeituraDashboardCardsRowClass,
              adminDashboardTopRowSectionClass,
              'lg:col-span-12 lg:grid-cols-12',
            ].join(' ')}
          >
            <div className="flex min-h-0 lg:col-span-4">
              <AdminHourlyChartPanel
                data={dashboard.hourly}
                animationKey={dashboard.filterKey}
                period={filters.period}
                className="h-full w-full"
              />
            </div>

            <div
              className={[
                prefeituraDashboardCardsRowClass,
                'h-full min-h-0 sm:grid-cols-2 lg:col-span-8',
              ].join(' ')}
            >
              <AdminNocCentralPanel
                className="h-full"
                incidents={dashboard.nocHighlight}
                totalOpen={dashboard.openNocCount}
                onOpenAll={handleOpenNocCentral}
                onSelectIncident={() => nocDrawer.openDrawer(dashboard.nocIncidents)}
              />
              <AdminPlatformPackagePanel
                className="h-full"
                usage={dashboard.packageUsage}
                animationKey={dashboard.filterKey}
                onClick={() => openKpiDrill('pacote')}
              />
            </div>
          </section>

          <section
            className={[prefeituraDashboardCardsRowClass, 'lg:col-span-12 lg:grid-cols-3'].join(
              ' ',
            )}
          >
            <AdminTerminalsPanel
              className="h-full"
              terminals={dashboard.terminals}
              onClick={() => openKpiDrill('terminais')}
            />
            <AdminRevenuePanel
              className="h-full"
              revenue={dashboard.revenue}
              onClick={() => openKpiDrill('receita')}
            />
            <AdminOperationalSummaryPanel
              className="h-full"
              municipalityCount={dashboard.municipalities.length}
              criticalIncidentCount={dashboard.criticalNocCount}
              openIncidentCount={dashboard.openNocCount}
              avgSlaMinutes={dashboard.avgSlaMinutes}
              healthSummary={{
                green: dashboard.municipalities.filter((m) => m.health === 'green').length,
                yellow: dashboard.municipalities.filter((m) => m.health === 'yellow').length,
                red: dashboard.municipalities.filter((m) => m.health === 'red').length,
              }}
              onOpenHealthDetail={() => openKpiDrill('saude')}
            />
          </section>

          <AdminTriageChartsSection
            data={dashboard.triageCharts}
            animationKey={dashboard.filterKey}
            periodLabel={
              adminDashboardFilterOptions.period.find((option) => option.value === filters.period)
                ?.label ?? 'Período selecionado'
            }
          />

          <section className="min-w-0 xl:col-span-12">
            <AdminMunicipalitiesTable
              rows={dashboard.municipalities}
              onOpenRow={municipalityDrawer.openDrawer}
              onOpenAll={() => openKpiDrill('saude')}
            />
          </section>
        </div>
      </div>

      {nocDrawer.drawerElement}
      {municipalityDrawer.drawerElement}
      {kpiDrillDrawer.drawerElement}
    </div>
  )
}
