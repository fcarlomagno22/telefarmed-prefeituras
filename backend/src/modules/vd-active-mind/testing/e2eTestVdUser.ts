import type { AuthenticatedVdUser } from '../../vd-auth/middleware.js'

/** Usuário VD fixo para testes E2E de rotas (sem JWT real). */
export const ACTIVE_MIND_E2E_TEST_VD_USER: AuthenticatedVdUser = {
  credencialId: '44444444-4444-4444-4444-444444444401',
  pacienteId: '44444444-4444-4444-4444-444444444402',
  cpf: '39053344705',
  nome: 'Paciente E2E Ativa Mente',
  entidadeContratanteId: '44444444-4444-4444-4444-444444444403',
}
