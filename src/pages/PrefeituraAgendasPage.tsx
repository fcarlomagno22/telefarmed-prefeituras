import { PrefeituraAgendasAttendanceCard } from '../components/prefeitura/agendas/PrefeituraAgendasAttendanceCard'
import { PrefeituraAgendasBottomCardSkeleton } from '../components/prefeitura/agendas/PrefeituraAgendasBottomCardSkeleton'
import { PrefeituraAgendasFutureCard } from '../components/prefeitura/agendas/PrefeituraAgendasFutureCard'
import { PrefeituraAgendasHighlightsCard } from '../components/prefeitura/agendas/PrefeituraAgendasHighlightsCard'
import { PrefeituraAgendasMainPanel } from '../components/prefeitura/agendas/PrefeituraAgendasMainPanel'
import { PrefeituraAgendasMainPanelSkeleton } from '../components/prefeitura/agendas/PrefeituraAgendasMainPanelSkeleton'
import { PrefeituraAgendasPageHeaderSkeleton } from '../components/prefeitura/agendas/PrefeituraAgendasPageHeaderSkeleton'
import { PrefeituraAgendasSidebarPanel } from '../components/prefeitura/agendas/PrefeituraAgendasSidebarPanel'
import { PrefeituraAgendasSidebarPanelSkeleton } from '../components/prefeitura/agendas/PrefeituraAgendasSidebarPanelSkeleton'
import {
  dashboardPageContentStackClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { prefeituraAgendasBottomCardsGridClass } from '../components/prefeitura/agendas/prefeituraAgendasUi'
import { usePrefeituraAgendasPage } from '../hooks/usePrefeituraAgendasPage'

const agendasColumnScrollClass = [
  'min-h-0 min-w-0',
  'xl:overflow-y-auto xl:overscroll-y-contain',
  'xl:[-ms-overflow-style:none] xl:[scrollbar-width:thin]',
  'xl:[&::-webkit-scrollbar]:w-1.5 xl:[&::-webkit-scrollbar-thumb]:rounded-full xl:[&::-webkit-scrollbar-thumb]:bg-gray-300 xl:[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

export function PrefeituraAgendasPage() {
  const {
    catalog,
    weekStart,
    weekEnd,
    dayKeys,
    unitFilter,
    selection,
    setSelection,
    weekData,
    dayData,
    futurePeriod,
    setFuturePeriod,
    futureData,
    packageUsage,
    weeklySummaryCards,
    isLoading,
    loadError,
    reloadAll,
    goToTodayWeek,
    goToWeekContainingDate,
    shiftWeek,
    handleUnitFilterChange,
    findUnit,
    getUnitOptionsForRegion,
    isViewingCurrentWeek,
    todayKey,
  } = usePrefeituraAgendasPage()

  return (
    <div
      className={[dashboardPageShellClass, 'flex-1 bg-slate-50/80 py-5'].join(' ')}
      aria-label="Gestão de agendas"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <PrefeituraAgendasPageHeaderSkeleton />
      ) : (
        <header className="relative z-30 shrink-0 overflow-visible px-0">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Gestão de agendas
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Agendas
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Comparecimento por unidade, heatmap semanal e agenda detalhada do dia.
            </p>
          </div>
        </header>
      )}

      {loadError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
          <button
            type="button"
            onClick={() => void reloadAll()}
            className="ml-3 font-semibold underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      <div
        className={[
          'mt-4 flex min-h-0 flex-1 flex-col gap-4',
          'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
          'max-xl:[-ms-overflow-style:none] max-xl:[scrollbar-width:thin]',
          'max-xl:[&::-webkit-scrollbar]:w-1.5 max-xl:[&::-webkit-scrollbar-thumb]:rounded-full max-xl:[&::-webkit-scrollbar-thumb]:bg-gray-300 max-xl:[&::-webkit-scrollbar-track]:bg-transparent',
          'xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:grid-rows-1 xl:items-stretch xl:gap-4 xl:overflow-hidden',
        ].join(' ')}
      >
        <div className={agendasColumnScrollClass}>
          <div className={[dashboardPageContentStackClass, 'min-w-0 pb-4'].join(' ')}>
            {isLoading ? (
              <PrefeituraAgendasMainPanelSkeleton />
            ) : (
              <PrefeituraAgendasMainPanel
                catalog={catalog}
                weekStart={weekStart}
                weekEnd={weekEnd}
                dayKeys={dayKeys}
                unitFilter={unitFilter}
                selection={selection}
                weekData={weekData}
                dayData={dayData}
                todayKey={todayKey}
                isViewingCurrentWeek={isViewingCurrentWeek}
                onSelectionChange={setSelection}
                onUnitFilterChange={handleUnitFilterChange}
                onPrevWeek={() => shiftWeek(-1)}
                onNextWeek={() => shiftWeek(1)}
                onGoToTodayWeek={goToTodayWeek}
                onGoToWeekContainingDate={goToWeekContainingDate}
                findUnit={findUnit}
                getUnitOptionsForRegion={getUnitOptionsForRegion}
              />
            )}

            {isLoading ? (
              <div className={prefeituraAgendasBottomCardsGridClass}>
                <PrefeituraAgendasBottomCardSkeleton titleWidth="w-44" rowCount={6} />
                <PrefeituraAgendasBottomCardSkeleton titleWidth="w-36" rowCount={4} />
                <PrefeituraAgendasBottomCardSkeleton titleWidth="w-32" rowCount={5} />
              </div>
            ) : (
              <div className={prefeituraAgendasBottomCardsGridClass}>
                <PrefeituraAgendasAttendanceCard rows={weekData?.attendanceByUnit ?? []} />
                <PrefeituraAgendasHighlightsCard highlights={weekData?.highlights ?? []} />
                <PrefeituraAgendasFutureCard
                  period={futurePeriod}
                  summary={futureData}
                  onPeriodChange={setFuturePeriod}
                />
              </div>
            )}
          </div>
        </div>

        <div className={agendasColumnScrollClass}>
          <div className="min-w-0 pb-4">
            {isLoading ? (
              <PrefeituraAgendasSidebarPanelSkeleton />
            ) : (
              <PrefeituraAgendasSidebarPanel
                weeklySummaryCards={weeklySummaryCards}
                packageUsage={packageUsage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
