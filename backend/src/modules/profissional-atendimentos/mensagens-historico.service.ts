import { ProfissionalAtendimentosError } from './errors.js'
import { profissionalOwnsHistoricoConsulta } from './historico-query.service.js'
import { listConsultaMensagensApi } from './mensagens-query.service.js'
import type { ProfissionalMensagemApi } from './schemas.js'

export async function listProfissionalMensagensHistorico(
  profissionalId: string,
  consultaId: string,
): Promise<ProfissionalMensagemApi[]> {
  const owns = await profissionalOwnsHistoricoConsulta(profissionalId, consultaId)
  if (!owns) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  return listConsultaMensagensApi(consultaId)
}
