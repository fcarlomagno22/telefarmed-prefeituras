import { useCallback, useMemo } from 'react'
import type { AdminEscalaShiftStatus, EscalaRepasseRule } from '../types/adminEscala'
import {
  ESCALA_REPASSE_READONLY_NOTICE,
  applyRepasseModalidadeChange,
  buildRepasseTooltipLines,
  ensureRepasseRule,
  formatCriteriosPresencaResumo,
  formatRepasseListLabel,
  formatRepasseRuleSummary,
  repasseModalidadeLabel,
  syncRepasseRuleAmounts,
  validateRepasseRule,
} from '../utils/adminEscala/repasseRule'

export type UseAdminEscalaRepasseRuleOptions = {
  repasseRule: EscalaRepasseRule
  amountCents: number
  /** Quando true, bloqueia edição (ex.: slot/programação já publicada). */
  readOnly?: boolean
  /** Status do batch ao editar escala existente — usado para inferir readOnly. */
  editingShiftStatuses?: AdminEscalaShiftStatus[]
}

export function useAdminEscalaRepasseRule({
  repasseRule,
  amountCents,
  readOnly = false,
  editingShiftStatuses,
}: UseAdminEscalaRepasseRuleOptions) {
  const inferredReadOnly =
    readOnly || Boolean(editingShiftStatuses?.some((status) => status === 'publicada'))

  const safeRule = useMemo(
    () => ensureRepasseRule(repasseRule, amountCents),
    [repasseRule, amountCents],
  )

  const validationError = useMemo(
    () => (inferredReadOnly ? null : validateRepasseRule(safeRule, amountCents)),
    [amountCents, inferredReadOnly, safeRule],
  )

  const summaryLabel = useMemo(() => formatRepasseRuleSummary(safeRule), [safeRule])
  const listLabel = useMemo(() => formatRepasseListLabel(safeRule), [safeRule])
  const modalidadeLabel = useMemo(
    () => repasseModalidadeLabel(safeRule.modalidade),
    [safeRule.modalidade],
  )
  const criteriosResumo = useMemo(
    () => formatCriteriosPresencaResumo(safeRule.criteriosPresenca),
    [safeRule.criteriosPresenca],
  )
  const tooltipLines = useMemo(
    () => buildRepasseTooltipLines(safeRule, amountCents),
    [amountCents, safeRule],
  )

  const patchRule = useCallback(
    (patch: Partial<EscalaRepasseRule>) => {
      if (inferredReadOnly) return null
      return syncRepasseRuleAmounts({ ...safeRule, ...patch }, amountCents)
    },
    [amountCents, inferredReadOnly, safeRule],
  )

  const changeModalidade = useCallback(
    (modalidade: EscalaRepasseRule['modalidade']) => {
      if (inferredReadOnly) return null
      return applyRepasseModalidadeChange(modalidade, safeRule, amountCents)
    },
    [amountCents, inferredReadOnly, safeRule],
  )

  const resolveAmountAfterRule = useCallback(
    (rule: EscalaRepasseRule) =>
      rule.modalidade === 'por_consulta'
        ? rule.valorConsultaCentavos
        : amountCents > 0
          ? amountCents
          : rule.valorPlantaoCentavos,
    [amountCents],
  )

  return {
    safeRule,
    validationError,
    summaryLabel,
    listLabel,
    modalidadeLabel,
    criteriosResumo,
    tooltipLines,
    isReadOnly: inferredReadOnly,
    readOnlyNotice: ESCALA_REPASSE_READONLY_NOTICE,
    patchRule,
    changeModalidade,
    resolveAmountAfterRule,
  }
}
