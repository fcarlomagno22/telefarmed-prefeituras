import { AttendanceStationCard } from '../components/dashboard/AttendanceStationCard'
import { HomeHeader } from '../components/dashboard/HomeHeader'
import { UnitWaitingQueueCard } from '../components/dashboard/UnitWaitingQueueCard'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useState } from 'react'
import type { WaitingQueueEntry } from '../data/waitingQueueStore'

export function HomePage() {
  useBrandTheme()
  const [queueCallTarget, setQueueCallTarget] = useState<WaitingQueueEntry | null>(null)
  const [isAttendanceActive, setIsAttendanceActive] = useState(false)

  function handleCallFromQueue(entry: WaitingQueueEntry) {
    if (isAttendanceActive) return
    setQueueCallTarget(entry)
  }

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          <HomeHeader />
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col pb-5',
          ].join(' ')}
        >
          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]',
              'xl:grid-cols-[minmax(0,1fr)_420px] xl:grid-rows-1 xl:items-stretch',
            ].join(' ')}
          >
            <AttendanceStationCard
              queueCallTarget={queueCallTarget}
              onQueueCallHandled={() => setQueueCallTarget(null)}
              onAttendanceActiveChange={setIsAttendanceActive}
            />
            <UnitWaitingQueueCard
              onCallPatient={handleCallFromQueue}
              callDisabled={isAttendanceActive}
            />
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
