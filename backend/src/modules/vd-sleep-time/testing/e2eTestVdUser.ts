import type { AuthenticatedVdUser } from '../../vd-auth/middleware.js'

/** Usuário VD fixo para testes E2E de rotas (sem JWT real). */
export const SLEEP_TIME_E2E_TEST_VD_USER: AuthenticatedVdUser = {
  credencialId: '22222222-2222-2222-2222-222222222201',
  pacienteId: '22222222-2222-2222-2222-222222222202',
  cpf: '52998224725',
  nome: 'Paciente E2E Sleep Time',
  entidadeContratanteId: '22222222-2222-2222-2222-222222222203',
}

/** Segundo paciente para testes de isolamento de scope. */
export const SLEEP_TIME_E2E_OTHER_VD_USER: AuthenticatedVdUser = {
  credencialId: '33333333-3333-3333-3333-333333333301',
  pacienteId: '33333333-3333-3333-3333-333333333302',
  cpf: '71428793860',
  nome: 'Paciente E2E Sleep Time Outro',
  entidadeContratanteId: '33333333-3333-3333-3333-333333333303',
}
