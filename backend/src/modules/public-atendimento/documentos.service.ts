import { listConsultaMensagensApi } from '../profissional-atendimentos/mensagens-query.service.js'
import { buildIssuedDocuments, loadConsultaClinicaData } from '../profissional-atendimentos/clinical-data.service.js'
import { resolveDocumentoDownloadUrl } from '../profissional-atendimentos/documentos-clinicos.service.js'
import {
  assertPublicConsultaReadable,
  loadPublicConsultaByCodigo,
} from './access.service.js'
import { logAtendimentoConsultaEventoSafe } from '../../lib/auditoria/atendimento-events.js'
import { PublicAtendimentoError } from './errors.js'
import type { ProfissionalIssuedDocumentApi } from '../profissional-atendimentos/schemas.js'

export async function listPublicDocumentos(codigoAtendimento: string): Promise<ProfissionalIssuedDocumentApi[]> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)

  const clinical = await loadConsultaClinicaData([consulta.id])
  const anexos = clinical.anexosByConsulta.get(consulta.id) ?? []
  const anexosProfissional = anexos.filter((item) => item.origem === 'profissional')

  return buildIssuedDocuments({
    anexosProfissional,
    signedUrls: clinical.signedUrlsByConsulta.get(consulta.id) ?? new Map(),
  })
}

export async function getPublicDocumentoDownloadUrl(
  codigoAtendimento: string,
  documentId: string,
): Promise<string> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)

  if (!documentId.startsWith('anexo-')) {
    throw new PublicAtendimentoError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const anexoId = documentId.slice('anexo-'.length)
  const clinical = await loadConsultaClinicaData([consulta.id])
  const anexos = clinical.anexosByConsulta.get(consulta.id) ?? []
  const owned = anexos.some((row) => row.id === anexoId && row.origem === 'profissional')

  if (!owned) {
    throw new PublicAtendimentoError('Documento não encontrado.', 'NOT_FOUND', 404)
  }

  const url = await resolveDocumentoDownloadUrl(anexoId)
  if (!url) {
    throw new PublicAtendimentoError('Arquivo indisponível.', 'UNAVAILABLE', 410)
  }

  logAtendimentoConsultaEventoSafe({
    acao: 'acao_sensivel',
    descricao: 'Download de documento clínico (paciente)',
    consultaId: consulta.id,
    codigoAtendimento,
    payload: { documentId, anexoId },
  })

  return url
}

export { listConsultaMensagensApi }
