import {
  createConsultaVideoToken,
  type ConsultaVideoTokenResult,
} from '../../lib/livekit/token.service.js'
import { loadOperacionalRowByCodigo } from '../profissional-atendimentos/clinical-data.service.js'
import {
  assertPublicConsultaEmAndamento,
  assertPublicConsultaReadable,
  loadPublicConsultaByCodigo,
} from './access.service.js'
import { PublicAtendimentoError } from './errors.js'

export type { ConsultaVideoTokenResult } from '../../lib/livekit/token.service.js'

export async function getPublicConsultaVideoToken(
  codigoAtendimento: string,
): Promise<ConsultaVideoTokenResult> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)
  assertPublicConsultaEmAndamento(consulta)

  const row = await loadOperacionalRowByCodigo(codigoAtendimento)
  if (!row) {
    throw new PublicAtendimentoError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
  }

  const patientName = String(row.paciente_nome ?? '').trim() || 'Paciente'

  return createConsultaVideoToken({
    consultaId: consulta.id,
    participantIdentity: `paciente-${consulta.pacienteId}`,
    participantName: patientName,
  })
}
