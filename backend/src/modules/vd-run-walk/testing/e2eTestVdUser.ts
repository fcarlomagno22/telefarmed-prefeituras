import type { AuthenticatedVdUser } from '../../vd-auth/middleware.js'

/** Usuário VD fixo para testes E2E de rotas (sem JWT real). */
export const RUN_WALK_E2E_TEST_VD_USER: AuthenticatedVdUser = {
  credencialId: '11111111-1111-1111-1111-111111111101',
  pacienteId: '11111111-1111-1111-1111-111111111102',
  cpf: '52998224725',
  nome: 'Paciente E2E Run Walk',
  entidadeContratanteId: '11111111-1111-1111-1111-111111111103',
}
