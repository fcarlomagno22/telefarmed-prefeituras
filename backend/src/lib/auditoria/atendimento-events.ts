import { sanitizeAuditoriaPayload } from './rules.js'
import { logAuditoriaEventoSafe } from './write.service.js'
import type { AuditoriaEventoAcao } from './types.js'

export function logAtendimentoConsultaEventoSafe(input: {
  acao: AuditoriaEventoAcao
  descricao: string
  consultaId?: string
  codigoAtendimento?: string
  profissionalId?: string | null
  entidadeContratanteId?: string | null
  unidadeUbtId?: string | null
  ip?: string | null
  payload?: Record<string, unknown>
}): void {
  logAuditoriaEventoSafe({
    portal: 'atendimento',
    acao: input.acao,
    pagina: 'atendimento',
    descricao: input.descricao.slice(0, 500),
    recursoTipo: 'consulta',
    recursoId: input.consultaId ?? input.codigoAtendimento ?? '',
    actor: {
      portal: 'atendimento',
      atorId: input.profissionalId ?? null,
      atorNome: input.profissionalId ? 'Profissional' : 'Portal público',
      atorTipo: input.profissionalId ? 'profissional' : 'atendimento_publico',
      profissionalId: input.profissionalId ?? null,
      entidadeContratanteId: input.entidadeContratanteId ?? null,
      unidadeUbtId: input.unidadeUbtId ?? null,
    },
    ip: input.ip ?? null,
    payload: sanitizeAuditoriaPayload({
      consultaId: input.consultaId,
      codigoAtendimento: input.codigoAtendimento,
      ...(input.payload ?? {}),
    }),
  })
}
