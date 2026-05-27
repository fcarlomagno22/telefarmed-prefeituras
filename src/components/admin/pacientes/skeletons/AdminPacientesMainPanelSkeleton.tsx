import { NetworkUsersMainPanelSkeleton } from '../../../users/NetworkUsersMainPanelSkeleton'

export function AdminPacientesMainPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col [&>section]:min-h-0 [&>section]:flex-1 [&>section]:border-0 [&>section]:shadow-none">
      <NetworkUsersMainPanelSkeleton />
    </div>
  )
}
