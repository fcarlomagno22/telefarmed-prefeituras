import type { ConfigCommercialRules } from '../../../types/adminConfiguracoes'
import { maskCurrencyBrl, parseCurrencyBrl } from '../../../utils/masks'

const BRL_API_PATTERN = /^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$/

export function formatCommercialRulesAvulsoForInput(value: string): string {
  if (!value.trim()) return ''
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount <= 0) return value
  const cents = Math.round(amount * 100)
  return maskCurrencyBrl(String(cents))
}

export function toCommercialRulesAvulsoApiValue(displayValue: string): string {
  const amount = parseCurrencyBrl(displayValue)
  if (amount <= 0) return ''
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function isValidCommercialRulesAvulsoApiValue(value: string): boolean {
  return BRL_API_PATTERN.test(value.trim())
}

export function commercialRulesAreEqual(
  left: ConfigCommercialRules,
  right: ConfigCommercialRules,
): boolean {
  return (
    left.defaultAllowExceedPackage === right.defaultAllowExceedPackage &&
    left.defaultAvulsoUnitValueBrl === right.defaultAvulsoUnitValueBrl &&
    left.minContractMonths === right.minContractMonths &&
    left.defaultImplantationDays === right.defaultImplantationDays &&
    left.requireAuthorizedSpecialtiesOnContract ===
      right.requireAuthorizedSpecialtiesOnContract &&
    left.blockConsultWhenPackageExceeded === right.blockConsultWhenPackageExceeded
  )
}

export function validateCommercialRulesDraft(
  draft: ConfigCommercialRules,
): string | null {
  if (!isValidCommercialRulesAvulsoApiValue(draft.defaultAvulsoUnitValueBrl)) {
    return 'Informe o valor avulso unitário no formato 0,00.'
  }
  if (draft.minContractMonths < 1 || draft.minContractMonths > 120) {
    return 'O mínimo de meses de contrato deve ser entre 1 e 120.'
  }
  if (draft.defaultImplantationDays < 1 || draft.defaultImplantationDays > 365) {
    return 'O prazo padrão de implantação deve ser entre 1 e 365 dias.'
  }
  return null
}

export function buildCommercialRulesPayloadFromDraft(
  draft: ConfigCommercialRules,
  avulsoDisplayValue: string,
): ConfigCommercialRules {
  return {
    ...draft,
    defaultAvulsoUnitValueBrl: toCommercialRulesAvulsoApiValue(avulsoDisplayValue),
  }
}
