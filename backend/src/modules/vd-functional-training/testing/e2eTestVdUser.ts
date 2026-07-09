import type { AuthenticatedVdUser } from '../../vd-auth/middleware.js'

/** Usuário VD fixo para testes E2E de rotas (sem JWT real). */
export const FUNCTIONAL_TRAINING_E2E_TEST_VD_USER: AuthenticatedVdUser = {
  credencialId: '11111111-1111-1111-1111-111111111201',
  pacienteId: '11111111-1111-1111-1111-111111111202',
  cpf: '39053344705',
  nome: 'Paciente E2E Functional Training',
  entidadeContratanteId: '11111111-1111-1111-1111-111111111203',
}
