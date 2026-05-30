import { AuditLogsPageContent } from '../components/auditoria/AuditLogsPageContent'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function AuditLogsPage() {
  useBrandTheme()

  return (
    <DashboardLayout>
      <AuditLogsPageContent scope="ubt" />
    </DashboardLayout>
  )
}
