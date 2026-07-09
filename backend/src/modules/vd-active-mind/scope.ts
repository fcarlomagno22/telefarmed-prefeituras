import type { FastifyRequest } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import { VdActiveMindError } from './errors.js'
import type { VdActiveMindPacienteScope } from './types.js'

export function resolveVdActiveMindPacienteScope(user: AuthenticatedVdUser): VdActiveMindPacienteScope {
  return {
    pacienteId: user.pacienteId,
    entidadeContratanteId: user.entidadeContratanteId,
    cpf: user.cpf,
  }
}

export function getVdActiveMindPacienteScopeFromRequest(
  request: FastifyRequest,
): VdActiveMindPacienteScope {
  const user = request.vdUser
  if (!user) {
    throw new VdActiveMindError('Não autenticado.', 'FORBIDDEN', 401)
  }

  return resolveVdActiveMindPacienteScope(user)
}
