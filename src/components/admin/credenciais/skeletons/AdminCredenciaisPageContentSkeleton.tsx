import type { AdminCredenciaisTab } from '../AdminCredenciaisTabs'
import { AdminCredenciaisInternoAboutPanelSkeleton } from './AdminCredenciaisInternoAboutPanelSkeleton'
import { AdminCredenciaisInternoMainPanelSkeleton } from './AdminCredenciaisInternoMainPanelSkeleton'
import { AdminCredenciaisOperadoresAboutPanelSkeleton } from './AdminCredenciaisOperadoresAboutPanelSkeleton'
import { AdminCredenciaisOperadoresMainPanelSkeleton } from './AdminCredenciaisOperadoresMainPanelSkeleton'
import { AdminCredenciaisTabsSkeleton } from './adminCredenciaisSkeletonUi'

const OPERADORES_PANEL_COPY: Record<
  Exclude<AdminCredenciaisTab, 'admin'>,
  { title: string; description: string; fixedScope: 'Prefeitura' | 'UBT' }
> = {
  prefeitura: {
    title: 'Gestores da prefeitura',
    description:
      'Usuários com acesso ao portal municipal (/prefeitura): dashboards, rede, contratos e gestão local.',
    fixedScope: 'Prefeitura',
  },
  ubt: {
    title: 'Operadores de UBT',
    description:
      'Usuários das unidades com acesso ao terminal UBT (/ubt): triagem, agenda, consultas e operação diária.',
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
      panelDescription={copy.description}
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
