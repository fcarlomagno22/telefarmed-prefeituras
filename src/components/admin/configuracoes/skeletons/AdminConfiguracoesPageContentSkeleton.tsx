import type { AdminConfiguracoesTab } from '../../../types/adminConfiguracoes'
import { AdminConfiguracoesTabsSkeleton } from './adminConfiguracoesSkeletonUi'
import { AdminConfigClinicoPanelSkeleton } from './AdminConfigClinicoPanelSkeleton'
import { AdminConfigConsultaPanelSkeleton } from './AdminConfigConsultaPanelSkeleton'
import { AdminConfigContratosPanelSkeleton } from './AdminConfigContratosPanelSkeleton'
import { AdminConfigLegalPanelSkeleton } from './AdminConfigLegalPanelSkeleton'

type AdminConfiguracoesPageContentSkeletonProps = {
  activeTab: AdminConfiguracoesTab
}

function AdminConfiguracoesPanelSkeleton({ activeTab }: AdminConfiguracoesPageContentSkeletonProps) {
  switch (activeTab) {
    case 'clinico':
      return <AdminConfigClinicoPanelSkeleton />
    case 'contratos':
      return <AdminConfigContratosPanelSkeleton />
    case 'consulta':
      return <AdminConfigConsultaPanelSkeleton />
    case 'legal':
      return <AdminConfigLegalPanelSkeleton />
    default:
      return <AdminConfigClinicoPanelSkeleton />
  }
}

export function AdminConfiguracoesPageContentSkeleton({
  activeTab,
}: AdminConfiguracoesPageContentSkeletonProps) {
  return (
    <>
      <AdminConfiguracoesTabsSkeleton />
      <AdminConfiguracoesPanelSkeleton activeTab={activeTab} />
    </>
  )
}
