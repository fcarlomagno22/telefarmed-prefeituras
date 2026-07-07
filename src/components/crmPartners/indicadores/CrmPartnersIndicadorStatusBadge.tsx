import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import type { CrmPartnersIndicadorStatus } from '../../../types/crmPartnersIndicadores'
import { crmPartnersIndicadorStatusBadgeConfig } from './crmPartnersIndicadoresUi'

type CrmPartnersIndicadorStatusBadgeProps = {
  status: CrmPartnersIndicadorStatus
}

export function CrmPartnersIndicadorStatusBadge({ status }: CrmPartnersIndicadorStatusBadgeProps) {
  return (
    <SituationStatusBadge
      config={crmPartnersIndicadorStatusBadgeConfig[status]}
      widthClass="w-[10.5rem]"
    />
  )
}
