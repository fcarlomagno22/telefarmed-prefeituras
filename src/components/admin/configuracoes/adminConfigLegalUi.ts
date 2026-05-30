import type { PresetLegalDocumentId } from '../../../types/adminConfiguracoes'

export const presetLegalDocumentLabels: Record<PresetLegalDocumentId, string> = {
  termos_uso: 'Termos de uso',
  faq: 'FAQ',
  privacidade: 'Política de privacidade',
  consentimento_informado: 'Termo de consentimento informado',
  lgpd: 'LGPD',
}

export function createCustomLegalDocumentId() {
  return `legal-${Date.now()}`
}
