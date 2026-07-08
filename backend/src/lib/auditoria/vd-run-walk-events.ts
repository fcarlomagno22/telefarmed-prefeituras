import type { FastifyRequest } from 'fastify'
import { normalizeCpf } from '../cpf.js'
import type { VdRunWalkPacienteScope } from '../../modules/vd-run-walk/types.js'
import { extractClientIp } from './context.js'
import { logAuditoriaEventoSafe } from './write.service.js'

function resolveVdRunWalkActor(
  request: FastifyRequest,
  scope: VdRunWalkPacienteScope,
) {
  return {
    portal: 'vd' as const,
    atorId: request.vdUser?.credencialId ?? scope.pacienteId,
    atorNome: request.vdUser?.nome ?? 'Paciente',
    atorTipo: 'paciente_app',
    cpf: normalizeCpf(scope.cpf),
    entidadeContratanteId: scope.entidadeContratanteId,
  }
}

export function auditRunWalkAtividadeRegistered(
  request: FastifyRequest,
  scope: VdRunWalkPacienteScope,
  input: {
    activityId: string
    clientActivityId: string
    modality: string
    created: boolean
    distanceKm: number
    activeMinutes: number
  },
): void {
  logAuditoriaEventoSafe({
    portal: 'vd',
    acao: 'inserir',
    pagina: 'run-walk/atividades',
    descricao: input.created
      ? 'Registro de atividade corrida/caminhada'
      : 'Reenvio idempotente de atividade corrida/caminhada',
    recursoTipo: 'run_walk_atividade',
    recursoId: input.activityId,
    actor: resolveVdRunWalkActor(request, scope),
    ip: extractClientIp(request),
    payload: {
      clientActivityId: input.clientActivityId,
      modality: input.modality,
      created: input.created,
      distanceKm: input.distanceKm,
      activeMinutes: input.activeMinutes,
    },
  })
}

export function auditRunWalkLocalCreated(
  request: FastifyRequest,
  scope: VdRunWalkPacienteScope,
  input: {
    localId: string
    name: string
    type: string
  },
): void {
  logAuditoriaEventoSafe({
    portal: 'vd',
    acao: 'inserir',
    pagina: 'run-walk/locais',
    descricao: 'Cadastro de local para corrida/caminhada',
    recursoTipo: 'running_route_spot',
    recursoId: input.localId,
    actor: resolveVdRunWalkActor(request, scope),
    ip: extractClientIp(request),
    payload: {
      name: input.name,
      type: input.type,
    },
  })
}

export function auditRunWalkLivePointsAppended(
  request: FastifyRequest,
  scope: VdRunWalkPacienteScope,
  input: {
    sessionId: string
    pointCount: number
    acceptedCount: number
  },
): void {
  logAuditoriaEventoSafe({
    portal: 'vd',
    acao: 'acao_sensivel',
    pagina: 'run-walk/live-sessoes/pontos',
    descricao: 'Append de pontos GPS em sessão ao vivo',
    recursoTipo: 'run_walk_live_session',
    recursoId: input.sessionId,
    actor: resolveVdRunWalkActor(request, scope),
    ip: extractClientIp(request),
    payload: {
      pointCount: input.pointCount,
      acceptedCount: input.acceptedCount,
    },
  })
}
