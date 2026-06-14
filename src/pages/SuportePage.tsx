import { SuportePageContent } from '../components/suporte/SuportePageContent'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useUbtPageAccess } from '../hooks/useUbtPageAccess'

export function SuportePage() {
  useBrandTheme()
  const { pageAccess } = useUbtPageAccess('suporte')

  return (
    <DashboardLayout>
      <SuportePageContent
        showNewTicketButton={pageAccess.canInsert}
        canReplyToTickets={pageAccess.canInsert}
      />
    </DashboardLayout>
  )
}
