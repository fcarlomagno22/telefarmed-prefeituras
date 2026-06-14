import { NetworkUsersAboutPanelSkeleton } from '../../../users/NetworkUsersAboutPanelSkeleton'

export function AdminProfissionaisAboutPanelSkeleton() {
  return (
    <div className="min-h-0 min-w-0 [&>aside]:h-auto" aria-busy="true" aria-label="Carregando resumo">
      <NetworkUsersAboutPanelSkeleton />
    </div>
  )
}
