import { AttendanceStationCard } from '../components/dashboard/AttendanceStationCard'
import { HomeHeader } from '../components/dashboard/HomeHeader'
import { UnitGuideCard } from '../components/dashboard/UnitGuideCard'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function HomePage() {
  useBrandTheme()

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6 lg:px-10">
          <HomeHeader />
        </div>

        <section className="mt-4 grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-4 pb-5 sm:mt-6 sm:pb-6 xl:grid-cols-[1fr_320px] xl:grid-rows-1">
          <AttendanceStationCard />
          <UnitGuideCard />
        </section>
      </div>
    </DashboardLayout>
  )
}
