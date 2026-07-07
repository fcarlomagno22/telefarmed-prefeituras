import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import type { CrmPartnersIndicadorNfStatus } from '../../../types/crmPartnersIndicadores'
import { crmPartnersIndicadorNfBadgeConfig } from './crmPartnersIndicadoresUi'

type CrmPartnersIndicadorNfBadgeProps = {
  status: CrmPartnersIndicadorNfStatus
}

export function CrmPartnersIndicadorNfBadge({ status }: CrmPartnersIndicadorNfBadgeProps) {
  return (
    <SituationStatusBadge
      config={crmPartnersIndicadorNfBadgeConfig[status]}
      widthClass="w-[6.5rem]"
    />
  )
}
