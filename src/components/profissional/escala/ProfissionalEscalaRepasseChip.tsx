import type { EscalaRepasseRule } from '../../../types/adminEscala'
import { repasseChipShortLabel } from '../../../utils/adminEscala/repasseRule'
import { AdminEscalaRepasseBadge } from '../../admin/escala/AdminEscalaRepasseBadge'

type ProfissionalEscalaRepasseChipProps = {
  repasseRule: EscalaRepasseRule
  amountCents: number
}

/** Chip compacto na listagem — transparência antes da inscrição. */
export function ProfissionalEscalaRepasseChip({
  repasseRule,
  amountCents,
}: ProfissionalEscalaRepasseChipProps) {
  return (
    <AdminEscalaRepasseBadge
      repasseRule={repasseRule}
      amountCents={amountCents}
      label={repasseChipShortLabel(repasseRule.modalidade)}
      tooltipTitle="Como você será pago"
      className="normal-case tracking-normal"
    />
  )
}
