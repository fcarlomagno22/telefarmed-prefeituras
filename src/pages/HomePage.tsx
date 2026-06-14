import { AttendanceStationCard } from '../components/dashboard/AttendanceStationCard'
import { HomeHeader } from '../components/dashboard/HomeHeader'
import { UnitDashboardKpiStrip } from '../components/dashboard/UnitDashboardKpiStrip'
import { UnitWaitingQueueCard } from '../components/dashboard/UnitWaitingQueueCard'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useUbtDashboardPage } from '../hooks/useUbtDashboardPage'
import { useCallback, useState } from 'react'
import type { WaitingQueueEntry } from '../types/waitingQueue'
import { useCallPatientFromQueue } from '../hooks/useCallPatientFromQueue'

export function HomePage() {
  useBrandTheme()
  const {
    unit,
    kpis,
    isLoading,
    loadError,
    reload,
  } = useUbtDashboardPage()
  const [queueCallTarget, setQueueCallTarget] = useState<WaitingQueueEntry | null>(null)
  const [isAttendanceActive, setIsAttendanceActive] = useState(false)

  const handleQueueCallHandled = useCallback(() => {
    setQueueCallTarget(null)
  }, [])

  const { callPatient, callNextPatient, isCalling, callError, calledName } = useCallPatientFromQueue({
    callDisabled: isAttendanceActive,
    onCalled: setQueueCallTarget,
  })

  function handleCallFromQueue(entry: WaitingQueueEntry) {
    void callPatient(entry)
  }

  function handleCallNextFromQueue() {
    void callNextPatient()
  }

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          <HomeHeader
            unitName={unit?.unitName}
            stationLabel={unit?.stationLabel}
          />
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col gap-4 pb-5',
          ].join(' ')}
        >
          {loadError ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          <UnitDashboardKpiStrip kpis={kpis} isLoading={isLoading} />

          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'grid-cols-1',
              'xl:grid-cols-[minmax(0,1fr)_420px]',
            ].join(' ')}
          >
            <AttendanceStationCard
              unitName={unit?.unitName}
              queueCallTarget={queueCallTarget}
              onQueueCallHandled={handleQueueCallHandled}
              onAttendanceActiveChange={setIsAttendanceActive}
            />

            <div className="flex min-h-0 flex-col xl:min-h-full">
              <UnitWaitingQueueCard
                onCallPatient={handleCallFromQueue}
                onCallNextPatient={handleCallNextFromQueue}
                callDisabled={isAttendanceActive}
                isCalling={isCalling}
                callError={callError}
                calledName={calledName}
              />
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
