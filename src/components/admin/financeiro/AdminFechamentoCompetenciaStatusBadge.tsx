import type { AdminFechamentoCompetenciaStatus } from '../../../types/adminFinanceiro'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  ADMIN_FECHAMENTO_STATUS_BADGE_WIDTH,
  adminFechamentoCompetenciaStatusBadgeConfig,
} from './adminFinanceiroUi'

type AdminFechamentoCompetenciaStatusBadgeProps = {
  status: AdminFechamentoCompetenciaStatus
}

export function AdminFechamentoCompetenciaStatusBadge({
  status,
}: AdminFechamentoCompetenciaStatusBadgeProps) {
  return (
    <SituationStatusBadge
      config={adminFechamentoCompetenciaStatusBadgeConfig[status]}
      widthClass={ADMIN_FECHAMENTO_STATUS_BADGE_WIDTH}
    />
  )
}
