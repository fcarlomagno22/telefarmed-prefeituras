import type { FastifyRequest } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { VdRunWalkError } from './errors.js'
import type { VdRunWalkPacienteScope } from './types.js'

export function resolveVdRunWalkPacienteScope(user: AuthenticatedVdUser): VdRunWalkPacienteScope {
  return {
    pacienteId: user.pacienteId,
    entidadeContratanteId: user.entidadeContratanteId,
    cpf: user.cpf,
  }
}

export function getVdRunWalkPacienteScopeFromRequest(
  request: FastifyRequest,
): VdRunWalkPacienteScope {
  const user = request.vdUser
  if (!user) {
    throw new VdRunWalkError('Não autenticado.', 'FORBIDDEN', 401)
  }

  return resolveVdRunWalkPacienteScope(user)
}
