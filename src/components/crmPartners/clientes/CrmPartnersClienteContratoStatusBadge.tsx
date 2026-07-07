import type { CrmPartnersClienteContratoStatus } from '../../../types/crmPartnersClientes'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { crmPartnersClienteContratoStatusBadgeConfig } from './crmPartnersClientesUi'

type CrmPartnersClienteContratoStatusBadgeProps = {
  status: CrmPartnersClienteContratoStatus
}

export function CrmPartnersClienteContratoStatusBadge({
  status,
}: CrmPartnersClienteContratoStatusBadgeProps) {
  return <SituationStatusBadge config={crmPartnersClienteContratoStatusBadgeConfig[status]} />
}
