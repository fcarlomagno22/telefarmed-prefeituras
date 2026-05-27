import { NetworkUsersMainPanelSkeleton } from '../../users/NetworkUsersMainPanelSkeleton'

export function PrefeituraUsuariosMainPanelSkeleton() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col [&>section]:h-full [&>section]:min-h-0 [&>section]:flex-1">
      <NetworkUsersMainPanelSkeleton />
    </div>
  )
}
