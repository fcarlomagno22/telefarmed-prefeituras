import { ProfissionalAtendimentosError } from '../profissional-atendimentos/errors.js'
import { loadConsultaByCodigo } from '../profissional-atendimentos/ownership.js'
import type { ConsultaAccessRow } from '../profissional-atendimentos/types.js'
import { PublicAtendimentoError } from './errors.js'

const STATUS_BLOQUEADOS = new Set(['cancelada'])

export async function loadPublicConsultaByCodigo(codigoAtendimento: string): Promise<ConsultaAccessRow> {
  try {
    return await loadConsultaByCodigo(codigoAtendimento)
  } catch (error) {
    if (error instanceof ProfissionalAtendimentosError && error.code === 'NOT_FOUND') {
      throw new PublicAtendimentoError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
    }
    throw error
  }
}

export function assertPublicConsultaReadable(consulta: ConsultaAccessRow): void {
  if (STATUS_BLOQUEADOS.has(consulta.status)) {
    throw new PublicAtendimentoError('Este atendimento não está disponível.', 'UNAVAILABLE', 410)
  }
}

export function assertPublicConsultaEmAndamento(consulta: ConsultaAccessRow): void {
  if (consulta.status !== 'em_andamento') {
    throw new PublicAtendimentoError(
      'O chat só está disponível enquanto a consulta está em andamento.',
      'CONFLICT',
      409,
    )
  }
}
