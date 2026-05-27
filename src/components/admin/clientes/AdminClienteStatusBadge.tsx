import type { AdminClienteStatus } from '../../../data/adminClientesMock'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  ADMIN_CLIENTE_STATUS_BADGE_WIDTH,
  adminClienteStatusBadgeConfig,
} from './adminClientesUi'

type AdminClienteStatusBadgeProps = {
  status: AdminClienteStatus
}

export function AdminClienteStatusBadge({ status }: AdminClienteStatusBadgeProps) {
  return (
    <SituationStatusBadge
      config={adminClienteStatusBadgeConfig[status]}
      widthClass={ADMIN_CLIENTE_STATUS_BADGE_WIDTH}
    />
  )
}
