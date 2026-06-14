import { NetworkUsersMainPanelSkeleton } from '../../../users/NetworkUsersMainPanelSkeleton'

export function AdminProfissionaisMainPanelSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col [&>section]:min-h-0 [&>section]:flex-1 [&>section]:border-0 [&>section]:shadow-none [&>section]:rounded-none"
      aria-busy="true"
      aria-label="Carregando profissionais"
    >
      <NetworkUsersMainPanelSkeleton />
    </div>
  )
}
