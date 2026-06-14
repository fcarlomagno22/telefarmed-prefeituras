import { ProfissionalAtendimentosError } from '../profissional-atendimentos/errors.js'
import {
  enviarPublicMensagemPaciente as enviarPacienteMensagem,
  uploadPublicMensagemAnexo,
} from '../profissional-atendimentos/mensagens.service.js'
import { listConsultaMensagensApi } from '../profissional-atendimentos/mensagens-query.service.js'
import { PublicAtendimentoError } from './errors.js'
import {
  assertPublicConsultaEmAndamento,
  assertPublicConsultaReadable,
  loadPublicConsultaByCodigo,
} from './access.service.js'
import type { ProfissionalMensagemApi } from '../profissional-atendimentos/schemas.js'

export async function listPublicMensagens(codigoAtendimento: string): Promise<ProfissionalMensagemApi[]> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)
  return listConsultaMensagensApi(consulta.id)
}

export async function enviarPublicMensagem(
  codigoAtendimento: string,
  conteudo: string,
): Promise<void> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)
  assertPublicConsultaEmAndamento(consulta)

  try {
    await enviarPacienteMensagem(consulta.id, consulta.pacienteId, conteudo)
  } catch (error) {
    if (error instanceof ProfissionalAtendimentosError && error.code === 'INVALID_DATA') {
      throw new PublicAtendimentoError(error.message, 'INVALID_DATA', 400)
    }
    throw error
  }
}

export async function uploadPublicMensagem(
  codigoAtendimento: string,
  file: { buffer: Buffer; mimeType: string; fileName: string },
  conteudo?: string,
): Promise<void> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)
  assertPublicConsultaEmAndamento(consulta)

  try {
    await uploadPublicMensagemAnexo(consulta.id, consulta.pacienteId, file, conteudo)
  } catch (error) {
    if (error instanceof ProfissionalAtendimentosError && error.code === 'INVALID_DATA') {
      throw new PublicAtendimentoError(error.message, 'INVALID_DATA', 400)
    }
    throw error
  }
}
