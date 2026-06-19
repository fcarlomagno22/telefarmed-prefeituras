import type { PresetLegalDocumentId } from '../../../types/adminConfiguracoes'

export const presetLegalDocumentLabels: Record<PresetLegalDocumentId, string> = {
  termos_uso: 'Termos de uso',
  faq: 'FAQ',
  privacidade: 'Política de privacidade',
  consentimento_informado: 'Termo de consentimento informado',
  lgpd: 'LGPD',
  cadastro_conferencia_dados: 'Cadastro — conferência de dados',
  cadastro_autorizacao_teleconsulta: 'Cadastro — autorização teleconsulta',
  cadastro_ciencia_dados: 'Cadastro — ciência de uso de dados',
  cadastro_permissao_notificacoes: 'Cadastro — permissão de notificações',
}

export function createCustomLegalDocumentId() {
  return `legal-${Date.now()}`
}
