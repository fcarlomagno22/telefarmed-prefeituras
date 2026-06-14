import type { AdminClienteContratoStatus } from '../../../types/adminClientes'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  ADMIN_CLIENTE_STATUS_BADGE_WIDTH,
  adminClienteContratoStatusBadgeConfig,
} from './adminClientesUi'

type AdminClienteContratoStatusBadgeProps = {
  status: AdminClienteContratoStatus
}

export function AdminClienteContratoStatusBadge({ status }: AdminClienteContratoStatusBadgeProps) {
  return (
    <SituationStatusBadge
      config={adminClienteContratoStatusBadgeConfig[status]}
      widthClass={ADMIN_CLIENTE_STATUS_BADGE_WIDTH}
    />
  )
}
