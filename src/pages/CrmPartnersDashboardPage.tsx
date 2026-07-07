import { CrmPartnersDashboardMainPanel } from '../components/crmPartners/dashboard/CrmPartnersDashboardMainPanel'

export function CrmPartnersDashboardPage() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Dashboard CRM Partners"
    >
      <CrmPartnersDashboardMainPanel />
    </div>
  )
}
