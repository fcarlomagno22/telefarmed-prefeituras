import {
  createConsultaVideoToken,
  type ConsultaVideoTokenResult,
} from '../../lib/livekit/token.service.js'
import {
  assertConsultaEmAndamento,
  assertConsultaOwnedByProfissional,
  loadConsultaByCodigo,
} from './ownership.js'

export type { ConsultaVideoTokenResult } from '../../lib/livekit/token.service.js'

export async function getProfissionalConsultaVideoToken(
  profissionalId: string,
  profissionalNome: string,
  codigoAtendimento: string,
): Promise<ConsultaVideoTokenResult> {
  const consulta = await loadConsultaByCodigo(codigoAtendimento)
  await assertConsultaOwnedByProfissional(profissionalId, consulta)
  await assertConsultaEmAndamento(consulta)

  return createConsultaVideoToken({
    consultaId: consulta.id,
    participantIdentity: `medico-${profissionalId}`,
    participantName: profissionalNome.trim() || 'Profissional',
  })
}
