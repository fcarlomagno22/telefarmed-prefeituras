import type { FastifyRequest } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { VdSleepTimeError } from './errors.js'
import type { VdSleepTimePacienteScope } from './types.js'

export function resolveVdSleepTimePacienteScope(user: AuthenticatedVdUser): VdSleepTimePacienteScope {
  return {
    pacienteId: user.pacienteId,
    entidadeContratanteId: user.entidadeContratanteId,
    cpf: user.cpf,
  }
}

export function getVdSleepTimePacienteScopeFromRequest(
  request: FastifyRequest,
): VdSleepTimePacienteScope {
  const user = request.vdUser
  if (!user) {
    throw new VdSleepTimeError('Não autenticado.', 'FORBIDDEN', 401)
  }

  return resolveVdSleepTimePacienteScope(user)
}
