import { useUbtAuth } from '../../contexts/UbtAuthContext'
import { PortalSuportePageShell } from './PortalSuportePageShell'

type SuportePageContentProps = {
  showNewTicketButton?: boolean
  canReplyToTickets?: boolean
}

export function SuportePageContent({
  showNewTicketButton = true,
  canReplyToTickets = true,
}: SuportePageContentProps) {
  const { getAccessToken } = useUbtAuth()

  return (
    <PortalSuportePageShell
      variant="ubt"
      getAccessToken={getAccessToken}
      summaryTitle="Seus chamados"
      showNewTicketButton={showNewTicketButton}
      canReplyToTickets={canReplyToTickets}
    />
  )
}
