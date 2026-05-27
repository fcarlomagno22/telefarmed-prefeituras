import { SuportePageContent } from '../components/suporte/SuportePageContent'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function SuportePage() {
  useBrandTheme()

  return (
    <DashboardLayout>
      <SuportePageContent />
    </DashboardLayout>
  )
}
