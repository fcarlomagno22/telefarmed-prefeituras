import type { PacienteCadastroOrigem, PacienteStatus } from '../admin-pacientes/types.js'

/** Defaults persistidos ao criar paciente via cadastro subset do app cidadão. */
export const APP_PACIENTE_REGISTRATION_DEFAULTS = {
  status: 'ativo' satisfies PacienteStatus,
  gender: 'nao_informado',
  cnsPendente: true,
  cadastroOrigem: 'app' satisfies PacienteCadastroOrigem,
} as const
