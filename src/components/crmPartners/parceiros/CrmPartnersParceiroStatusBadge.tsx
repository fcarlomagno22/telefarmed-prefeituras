import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import type { CrmPartnersParceiroStatus } from '../../../types/crmPartnersParceiros'
import { crmPartnersParceiroStatusBadgeConfig } from './crmPartnersParceirosUi'

type CrmPartnersParceiroStatusBadgeProps = {
  status: CrmPartnersParceiroStatus
}

export function CrmPartnersParceiroStatusBadge({ status }: CrmPartnersParceiroStatusBadgeProps) {
  return <SituationStatusBadge config={crmPartnersParceiroStatusBadgeConfig[status]} />
}
