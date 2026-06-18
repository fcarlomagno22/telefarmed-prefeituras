import type { AdminCredenciaisTab } from '../AdminCredenciaisTabs'
import { AdminCredenciaisInternoAboutPanelSkeleton } from './AdminCredenciaisInternoAboutPanelSkeleton'
import { AdminCredenciaisInternoMainPanelSkeleton } from './AdminCredenciaisInternoMainPanelSkeleton'
import { AdminCredenciaisOperadoresAboutPanelSkeleton } from './AdminCredenciaisOperadoresAboutPanelSkeleton'
import { AdminCredenciaisOperadoresMainPanelSkeleton } from './AdminCredenciaisOperadoresMainPanelSkeleton'
import { AdminCredenciaisTabsSkeleton } from './adminCredenciaisSkeletonUi'

const OPERADORES_PANEL_COPY: Record<
  Exclude<AdminCredenciaisTab, 'admin'>,
  { title: string; fixedScope: 'Prefeitura' | 'UBT' }
> = {
  prefeitura: {
    title: 'Gestores da entidade',
    fixedScope: 'Prefeitura',
  },
  ubt: {
    title: 'Operadores de UBT',
    fixedScope: 'UBT',
  },
}

type AdminCredenciaisPageContentSkeletonProps = {
  activeTab: AdminCredenciaisTab
}

export function AdminCredenciaisMainPanelSkeleton({
  activeTab,
}: AdminCredenciaisPageContentSkeletonProps) {
  if (activeTab === 'admin') {
    return <AdminCredenciaisInternoMainPanelSkeleton />
  }

  const copy = OPERADORES_PANEL_COPY[activeTab]
  return (
    <AdminCredenciaisOperadoresMainPanelSkeleton
      fixedScope={copy.fixedScope}
      panelTitle={copy.title}
    />
  )
}

export function AdminCredenciaisAboutPanelSkeleton({
  activeTab,
}: AdminCredenciaisPageContentSkeletonProps) {
  if (activeTab === 'admin') {
    return <AdminCredenciaisInternoAboutPanelSkeleton />
  }
  return <AdminCredenciaisOperadoresAboutPanelSkeleton />
}

export function AdminCredenciaisCardSkeleton({
  activeTab,
}: AdminCredenciaisPageContentSkeletonProps) {
  return (
    <>
      <AdminCredenciaisTabsSkeleton />
      <AdminCredenciaisMainPanelSkeleton activeTab={activeTab} />
    </>
  )
}
