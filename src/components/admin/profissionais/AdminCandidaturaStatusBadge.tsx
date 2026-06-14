import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import type { AdminCandidaturaStatus } from '../../../types/adminProfissionais'
import { adminCandidaturaStatusBadgeConfig } from './adminProfissionaisUi'

type AdminCandidaturaStatusBadgeProps = {
  status: AdminCandidaturaStatus
  className?: string
}

export function AdminCandidaturaStatusBadge({
  status,
  className,
}: AdminCandidaturaStatusBadgeProps) {
  const config = adminCandidaturaStatusBadgeConfig[status]
  return <SituationStatusBadge config={config} widthClass={className} />
}
