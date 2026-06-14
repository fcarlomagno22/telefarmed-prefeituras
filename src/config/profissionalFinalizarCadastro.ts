export const profissionalFinalizarCadastroSteps = [
  { id: 'access', label: 'Código' },
  { id: 'empresa', label: 'CNPJ' },
  { id: 'confirmarEmpresa', label: 'Confirmação' },
  { id: 'pix', label: 'PIX' },
  { id: 'foto', label: 'Selfie' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'senha', label: 'Senha' },
] as const

export type ProfissionalFinalizarCadastroStepId =
  (typeof profissionalFinalizarCadastroSteps)[number]['id']

export const PROFISSIONAL_FINALIZAR_CADASTRO_CODE_EXPIRY_DAYS = 10

export const PROFISSIONAL_FINALIZAR_CADASTRO_MIN_PASSWORD_LENGTH = 8
