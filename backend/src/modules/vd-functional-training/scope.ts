import type { FastifyRequest } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { VdFunctionalTrainingError } from './errors.js'
import type { VdFunctionalTrainingPacienteScope } from './types.js'

export function resolveVdFunctionalTrainingPacienteScope(
  user: AuthenticatedVdUser,
): VdFunctionalTrainingPacienteScope {
  return {
    pacienteId: user.pacienteId,
    entidadeContratanteId: user.entidadeContratanteId,
    cpf: user.cpf,
  }
}

export function getVdFunctionalTrainingPacienteScopeFromRequest(
  request: FastifyRequest,
): VdFunctionalTrainingPacienteScope {
  const user = request.vdUser
  if (!user) {
    throw new VdFunctionalTrainingError('Não autenticado.', 'FORBIDDEN', 401)
  }

  return resolveVdFunctionalTrainingPacienteScope(user)
}
