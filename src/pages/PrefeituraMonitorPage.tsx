import { prefeituraMonitorGridClass } from '../components/layout/dashboardPageLayout'
import { PrefeituraMonitorPageSkeleton } from '../components/prefeitura/skeletons/PrefeituraMonitorPageSkeleton'
import { PrefeituraMonitorIllustration } from '../components/prefeitura/monitor/PrefeituraMonitorIllustration'
import { PrefeituraMonitorLiveGrid } from '../components/prefeitura/monitor/PrefeituraMonitorLiveGrid'
import { PrefeituraMonitorOngoingServicesTable } from '../components/prefeitura/monitor/PrefeituraMonitorOngoingServicesTable'
import { PrefeituraMonitorTimelineCard } from '../components/prefeitura/monitor/PrefeituraMonitorTimelineCard'
import { PrefeituraMonitorUbsComparison } from '../components/prefeitura/monitor/PrefeituraMonitorUbsComparison'
import { usePrefeituraMonitorPage } from '../hooks/usePrefeituraMonitorPage'
import { usePrefeituraMonitorRankingDrawer } from '../hooks/usePrefeituraMonitorRankingDrawer'

export function PrefeituraMonitorPage() {
  const {
    regionKey,
    setRegionKey,
    timelinePeriod,
    setTimelinePeriod,
    overview,
    isLoading,
    loadError,
    reload,
    getPreviewRankingForTab,
    filterOptions,
  } = usePrefeituraMonitorPage()
  const rankingDrawer = usePrefeituraMonitorRankingDrawer({
    getPreviewRankingForTab,
    regionKey,
    timelinePeriod,
  })

  return (
    <>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-slate-50/80"
        aria-label="Monitor operacional"
        aria-busy={isLoading}
      >
        {isLoading && !overview ? (
          <PrefeituraMonitorPageSkeleton />
        ) : (
          <div className="w-full space-y-4 py-5">
            <header className="relative z-30 shrink-0 overflow-visible">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Gestão da rede
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
                  Monitor Operacional
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Acompanhe em tempo real o desempenho e o fluxo de atendimento da rede de
                  teleatendimento.
                </p>
              </div>
            </header>

            {loadError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loadError}
              </p>
            ) : null}

            {overview ? (
              <section className={prefeituraMonitorGridClass}>
                <PrefeituraMonitorLiveGrid
                  className="h-full min-h-[280px]"
                  rows={overview.liveGrid}
                  region={regionKey}
                  onRegionChange={setRegionKey}
                  regionOptions={filterOptions.region}
                  onRefresh={reload}
                />
                <PrefeituraMonitorTimelineCard
                  className="h-full min-h-[280px]"
                  timelinePeriod={timelinePeriod}
                  onTimelinePeriodChange={setTimelinePeriod}
                  timelinePeriodOptions={filterOptions.timelinePeriod}
                  hours={overview.timelineHours}
                  series={overview.timelineSeries}
                />
                <PrefeituraMonitorUbsComparison
                  className="h-full min-h-[260px]"
                  rankingByTab={overview.rankingByTab}
                  onOpenFullRanking={(tab) => rankingDrawer.openDrawer({ initialTab: tab })}
                />
                <PrefeituraMonitorIllustration className="h-full min-h-[16rem]" />
                <div className="xl:col-span-2">
                  <PrefeituraMonitorOngoingServicesTable services={overview.ongoingServices} />
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      {rankingDrawer.drawerElement}
    </>
  )
}
