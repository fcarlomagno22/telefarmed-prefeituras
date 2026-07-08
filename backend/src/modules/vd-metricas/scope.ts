import type { FastifyRequest } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { VdMetricasError } from './errors.js'
import type { VdMetricasPacienteScope } from './types.js'

export function resolveVdMetricasPacienteScope(user: AuthenticatedVdUser): VdMetricasPacienteScope {
  return {
    pacienteId: user.pacienteId,
    entidadeContratanteId: user.entidadeContratanteId,
    cpf: user.cpf,
  }
}

export function getVdMetricasPacienteScopeFromRequest(
  request: FastifyRequest,
): VdMetricasPacienteScope {
  const user = request.vdUser
  if (!user) {
    throw new VdMetricasError('Não autenticado.', 'FORBIDDEN', 401)
  }

  return resolveVdMetricasPacienteScope(user)
}
