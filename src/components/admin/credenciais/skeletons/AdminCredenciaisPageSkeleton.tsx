import {
  adminPacientesColumnScrollClass,
  adminPacientesMainColumnWrapClass,
  adminPacientesSidebarColumnWrapClass,
} from '../../pacientes/adminPacientesPageLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../../../layout/dashboardPageLayout'
import type { AdminCredenciaisTab } from '../AdminCredenciaisTabs'
import { AdminCredenciaisPageHeaderSkeleton } from './adminCredenciaisSkeletonUi'
import { AdminCredenciaisPageKpiRowSkeleton } from './adminCredenciaisSkeletonUi'
import {
  AdminCredenciaisAboutPanelSkeleton,
  AdminCredenciaisCardSkeleton,
} from './AdminCredenciaisPageContentSkeleton'

const mainCardShellClass = [
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

type AdminCredenciaisPageSkeletonProps = {
  activeTab?: AdminCredenciaisTab
}

export function AdminCredenciaisPageSkeleton({
  activeTab = 'admin',
}: AdminCredenciaisPageSkeletonProps) {
  return (
    <div className={dashboardPageShellClass} aria-busy="true" aria-label="Carregando credenciais">
      <div className={dashboardPageHeaderWrapClass}>
        <AdminCredenciaisPageHeaderSkeleton />
      </div>

      <div
        className={[
          dashboardPageScrollPaddingClass,
          'mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-5',
        ].join(' ')}
      >
        <AdminCredenciaisPageKpiRowSkeleton />

        <section
          className={[dashboardTwoColumnLayoutClass, 'min-h-0 flex-1 overflow-hidden'].join(' ')}
        >
          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesMainColumnWrapClass}>
              <div className={mainCardShellClass}>
                <AdminCredenciaisCardSkeleton activeTab={activeTab} />
              </div>
            </div>
          </div>

          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesSidebarColumnWrapClass}>
              <AdminCredenciaisAboutPanelSkeleton activeTab={activeTab} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
