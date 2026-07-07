import type { CrmPartnersClienteTipo } from '../../../types/crmPartnersParceiros'
import {
  crmPartnersClienteTipoBadgeBaseClass,
  crmPartnersClienteTipoBadgeClass,
  formatCrmPartnersClienteTipo,
} from './crmPartnersClientesUi'

type CrmPartnersClienteTipoBadgeProps = {
  tipo: CrmPartnersClienteTipo
}

export function CrmPartnersClienteTipoBadge({ tipo }: CrmPartnersClienteTipoBadgeProps) {
  return (
    <span className={[crmPartnersClienteTipoBadgeBaseClass, crmPartnersClienteTipoBadgeClass[tipo]].join(' ')}>
      {formatCrmPartnersClienteTipo(tipo)}
    </span>
  )
}
