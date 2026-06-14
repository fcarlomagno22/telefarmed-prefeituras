import { useMemo, useState } from 'react'
import { PrefeituraConsultasFilters } from '../components/prefeitura/consultas/PrefeituraConsultasFilters'
import { PrefeituraConsultasFiltersSkeleton } from '../components/prefeitura/consultas/PrefeituraConsultasFiltersSkeleton'
import { PrefeituraConsultasIllustration } from '../components/prefeitura/consultas/PrefeituraConsultasIllustration'
import { PrefeituraConsultasIllustrationSkeleton } from '../components/prefeitura/consultas/PrefeituraConsultasIllustrationSkeleton'
import { PrefeituraConsultasKpiCards } from '../components/prefeitura/consultas/PrefeituraConsultasKpiCards'
import { PrefeituraConsultasKpiCardsSkeleton } from '../components/prefeitura/consultas/PrefeituraConsultasKpiCardsSkeleton'
import { PrefeituraConsultasMainPanel } from '../components/prefeitura/consultas/PrefeituraConsultasMainPanel'
import { PrefeituraConsultasMainPanelSkeleton } from '../components/prefeitura/consultas/PrefeituraConsultasMainPanelSkeleton'
import { PrefeituraConsultasPageHeaderSkeleton } from '../components/prefeitura/consultas/PrefeituraConsultasPageHeaderSkeleton'
import { PrefeituraConsultasSidebarPanel } from '../components/prefeitura/consultas/PrefeituraConsultasSidebarPanel'
import { PrefeituraConsultasSidebarPanelSkeleton } from '../components/prefeitura/consultas/PrefeituraConsultasSidebarPanelSkeleton'
import { PrefeituraConsultasUnitsBand } from '../components/prefeitura/consultas/PrefeituraConsultasUnitsBand'
import {
  dashboardPageContentStackClass,
  dashboardPageScrollAreaClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  useDefaultPrefeituraConsultasPeriod,
  usePrefeituraConsultasPage,
} from '../hooks/usePrefeituraConsultasPage'
import { usePrefeituraConsultasUnitDetailDrawer } from '../hooks/usePrefeituraConsultasUnitDetailDrawer'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'

export function PrefeituraConsultasPage() {
  const { isBootstrapping, isAuthenticated } = usePrefeituraAuth()
  const defaultPeriod = useDefaultPrefeituraConsultasPeriod()
  const [unitFilter, setUnitFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start)
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end)

  const { overview, isLoading: dataLoading, loadError, loadUnitDetail } = usePrefeituraConsultasPage(
    periodStart,
    periodEnd,
    unitFilter,
    regionFilter,
  )

  const isLoading = isBootstrapping || (isAuthenticated && dataLoading)

  const unitDetailDrawer = usePrefeituraConsultasUnitDetailDrawer({ loadUnitDetail })

  const filterKey = useMemo(
    () => `${unitFilter}-${regionFilter}-${periodStart}-${periodEnd}`,
    [unitFilter, regionFilter, periodStart, periodEnd],
  )

  return (
    <>
      <div
        className={[dashboardPageShellClass, 'flex-1 bg-slate-50/80 py-5'].join(' ')}
        aria-label="Gestão de consultas"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <PrefeituraConsultasPageHeaderSkeleton />
        ) : (
          <header className="relative z-30 shrink-0 overflow-visible">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Gestão de consultas
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
                Consultas
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Visão unificada das consultas de telemedicina em toda a rede municipal.
              </p>
            </div>
          </header>
        )}

        <div className={[dashboardPageScrollAreaClass, 'mt-4 min-h-0 flex-1'].join(' ')}>
          <section
            key={isLoading ? 'loading' : filterKey}
            className={[
              dashboardPageContentStackClass,
              'flex min-h-0 flex-1 flex-col gap-4 pb-4',
              'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-[auto_auto_1fr] xl:gap-4',
            ].join(' ')}
          >
            <div className="min-w-0 shrink-0 xl:col-start-1 xl:row-start-1">
              {isLoading ? (
                <PrefeituraConsultasKpiCardsSkeleton />
              ) : (
                <PrefeituraConsultasKpiCards items={overview?.kpis ?? []} />
              )}
            </div>

            <div className="min-w-0 shrink-0 xl:col-start-1 xl:row-start-2">
              {isLoading ? (
                <PrefeituraConsultasFiltersSkeleton />
              ) : (
                <PrefeituraConsultasFilters
                  unit={unitFilter}
                  region={regionFilter}
                  periodStart={periodStart}
                  periodEnd={periodEnd}
                  onUnitChange={setUnitFilter}
                  onRegionChange={setRegionFilter}
                  onPeriodStartChange={setPeriodStart}
                  onPeriodEndChange={setPeriodEnd}
                  unitOptions={overview?.filterOptions.units}
                  regionOptions={overview?.filterOptions.regions}
                />
              )}
            </div>

            {isLoading ? (
              <PrefeituraConsultasIllustrationSkeleton className="min-h-[12rem] h-full xl:col-start-2 xl:row-span-2 xl:row-start-1" />
            ) : (
              <PrefeituraConsultasIllustration className="min-h-[12rem] h-full xl:col-start-2 xl:row-span-2 xl:row-start-1" />
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:col-span-2 xl:row-start-3">
              <PrefeituraConsultasUnitsBand
                layoutKey={isLoading ? 'loading' : filterKey}
                sidebar={
                  isLoading ? (
                    <PrefeituraConsultasSidebarPanelSkeleton />
                  ) : (
                    <PrefeituraConsultasSidebarPanel
                      dailySeries={overview?.dailySeries}
                      periodTotal={overview?.periodTotal}
                      specialties={overview?.specialties}
                    />
                  )
                }
                main={(fillHeight) =>
                  isLoading ? (
                    <PrefeituraConsultasMainPanelSkeleton fillHeight={fillHeight} />
                  ) : (
                    <PrefeituraConsultasMainPanel
                      rows={overview?.units ?? []}
                      unitFilter={unitFilter}
                      regionFilter={regionFilter}
                      periodStart={periodStart}
                      periodEnd={periodEnd}
                      unitDetailDrawer={unitDetailDrawer}
                      fillHeight={fillHeight}
                    />
                  )
                }
              />
            </div>
          </section>
        </div>
      </div>

      {!isLoading ? unitDetailDrawer.drawerElement : null}
    </>
  )
}
