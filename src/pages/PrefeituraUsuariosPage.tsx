import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { PrefeituraUsuariosAboutPanel } from '../components/prefeitura/usuarios/PrefeituraUsuariosAboutPanel'
import { PrefeituraUsuariosAboutPanelSkeleton } from '../components/prefeitura/usuarios/PrefeituraUsuariosAboutPanelSkeleton'
import { PrefeituraUsuariosMainPanel } from '../components/prefeitura/usuarios/PrefeituraUsuariosMainPanel'
import { PrefeituraUsuariosMainPanelSkeleton } from '../components/prefeitura/usuarios/PrefeituraUsuariosMainPanelSkeleton'
import {
  prefeituraUsuariosColumnScrollClass,
  prefeituraUsuariosColumnsGridClass,
  prefeituraUsuariosMainColumnWrapClass,
  prefeituraUsuariosSidebarColumnWrapClass,
} from '../components/prefeitura/usuarios/prefeituraUsuariosPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function PrefeituraUsuariosPage() {
  const isLoading = usePageSkeletonLoading(1800)

  return (
    <div className={dashboardPageShellClass}>
      <div className={dashboardPageHeaderWrapClass}>
        {isLoading ? (
          <DashboardPageHeaderSkeleton />
        ) : (
          <DashboardPageHeader
            title="Pacientes"
            subtitle="Base única municipal — visão consolidada, LGPD e campanhas de retorno"
          />
        )}
      </div>

      <div
        className={[
          prefeituraUsuariosColumnsGridClass,
          dashboardPageScrollPaddingClass,
          'mt-4 pb-5',
        ].join(' ')}
      >
        <div className={prefeituraUsuariosColumnScrollClass}>
          <div className={prefeituraUsuariosMainColumnWrapClass}>
            {isLoading ? <PrefeituraUsuariosMainPanelSkeleton /> : <PrefeituraUsuariosMainPanel />}
          </div>
        </div>

        <div className={prefeituraUsuariosColumnScrollClass}>
          <div className={prefeituraUsuariosSidebarColumnWrapClass}>
            {isLoading ? (
              <PrefeituraUsuariosAboutPanelSkeleton />
            ) : (
              <PrefeituraUsuariosAboutPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
