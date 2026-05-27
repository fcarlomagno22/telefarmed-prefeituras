import { useCallback, useMemo } from 'react'
import { useAdminKpiDrillDrawer } from '../../../hooks/useAdminKpiDrillDrawer'
import { useAdminMunicipalityDrawer } from '../../../hooks/useAdminMunicipalityDrawer'
import { useAdminNocDrawer } from '../../../hooks/useAdminNocDrawer'
import {
  buildAdminKpiDrillRows,
  computeAdminDashboardView,
  kpiIndexToDrillKind,
} from '../../../utils/adminDashboardFilters'
import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  prefeituraDashboardCardsRowClass,
} from '../../layout/dashboardPageLayout'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { PrefeituraSystemReleaseFootnote } from '../../prefeitura/PrefeituraSystemReleaseFootnote'
import { AdminOperationalSummaryPanel } from './AdminOperationalSummaryPanel'
import { AdminMunicipalitiesTable } from './AdminMunicipalitiesTable'
import { AdminNocCentralPanel } from './AdminNocCentralPanel'
import { AdminPlatformPackagePanel } from './AdminPlatformPackagePanel'
import { AdminRevenuePanel } from './AdminRevenuePanel'
import { AdminTerminalsPanel } from './AdminTerminalsPanel'
import { adminDashboardTopRowSectionClass } from './adminDashboardUi'

const defaultDashboardFilters = {
  period: 'hoje',
  state: 'all',
  contract: 'all',
  health: 'all',
} as const

export function AdminDashboardMainPanel() {
  const filters = defaultDashboardFilters

  const dashboard = useMemo(() => computeAdminDashboardView(filters), [filters])

  const nocDrawer = useAdminNocDrawer()
  const municipalityDrawer = useAdminMunicipalityDrawer()
  const kpiDrillDrawer = useAdminKpiDrillDrawer()

  const handleOpenNocCentral = useCallback(() => {
    nocDrawer.openDrawer(dashboard.nocIncidents)
  }, [nocDrawer, dashboard.nocIncidents])

  const handleKpiClick = useCallback(
    (index: number) => {
      const kind = kpiIndexToDrillKind(index)
      kpiDrillDrawer.openDrawer(kind, buildAdminKpiDrillRows(kind, dashboard))
    },
    [kpiDrillDrawer, dashboard],
  )

  const openKpiDrill = useCallback(
    (kind: ReturnType<typeof kpiIndexToDrillKind>) => {
      kpiDrillDrawer.openDrawer(kind, buildAdminKpiDrillRows(kind, dashboard))
    },
    [kpiDrillDrawer, dashboard],
  )

  return (
    <div className={dashboardPageScrollAreaClass}>
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
          <div className="flex shrink-0 flex-col items-end gap-2">
            <PrefeituraSystemReleaseFootnote />
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-12">
          <section
            className={[
              prefeituraDashboardCardsRowClass,
              adminDashboardTopRowSectionClass,
              'lg:col-span-12 lg:grid-cols-12',
            ].join(' ')}
          >
            <div className="flex min-h-0 lg:col-span-4">
              <KpiStatCards
                items={dashboard.kpiCards}
                updateKey={dashboard.filterKey}
                layout="grid-3x2"
                className="h-full w-full"
                animated
                onItemClick={handleKpiClick}
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
