import type { FastifyRequest } from 'fastify'
import { normalizeCpf } from '../cpf.js'
import { extractClientIp } from './context.js'
import { auditAuthLoginSuccess } from './auth-events.js'
import { logAuditoriaEventoSafe } from './write.service.js'

export function auditVdCadastroRegistration(
  request: FastifyRequest,
  input: {
    pacienteId: string
    credencialId: string
    cpf: string
    patientName: string
    entidadeContratanteId: string
    mode: 'created' | 'updated' | 'credentials_only'
  },
): void {
  logAuditoriaEventoSafe({
    portal: 'vd',
    acao: 'inserir',
    pagina: 'cadastro/registrar',
    descricao: 'Cadastro self-service app cidadão',
    recursoTipo: 'paciente',
    recursoId: input.pacienteId,
    actor: {
      portal: 'vd',
      atorId: input.credencialId,
      atorNome: input.patientName,
      atorTipo: 'paciente_app',
      cpf: normalizeCpf(input.cpf),
      entidadeContratanteId: input.entidadeContratanteId,
    },
    ip: extractClientIp(request),
    payload: {
      mode: input.mode,
      credencialId: input.credencialId,
    },
  })

  auditAuthLoginSuccess('vd', request, {
    atorId: input.credencialId,
    atorNome: input.patientName,
    cpf: input.cpf,
    role: 'paciente_app',
    entidadeContratanteId: input.entidadeContratanteId,
  })
}
