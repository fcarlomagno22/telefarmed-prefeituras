import { isBackendApiEnabled } from '../../api/config'
import { isProfissionalHistoricoDemoSessionKey } from '../../../config/profissionalHistoricoDemo'
import * as api from '../../api/profissional/atendimentos'
import * as mock from '../../mockServices/profissional/atendimentos'

const useApi = isBackendApiEnabled()

function useMockForSession(key: string): boolean {
  return !useApi || isProfissionalHistoricoDemoSessionKey(key)
}

export type ProfissionalFilaAtivaItemApi = api.ProfissionalFilaAtivaItemApi
export type ProfissionalConsultaSessao = api.ProfissionalConsultaSessao
export type ProfissionalAtendimentoDetail = import('../../../types/profissionalAtendimentos').ProfissionalAtendimentoDetail

export const ProfissionalAtendimentosApiError = useApi
  ? api.ProfissionalAtendimentosApiError
  : mock.ProfissionalAtendimentosApiError

export const fetchProfissionalFilaAtiva = useApi
  ? api.fetchProfissionalFilaAtiva
  : mock.fetchProfissionalFilaAtiva

export const iniciarProfissionalConsultaFromQueue = useApi
  ? api.iniciarProfissionalConsultaFromQueue
  : async (_token: string, body: { consultaId?: string }) => {
      const codigo = body.consultaId ?? 'mock-local'
      await mock.iniciarProfissionalConsultaPorCodigo(_token, codigo)
      return { consultaId: codigo, codigoAtendimento: codigo, status: 'em_andamento' }
    }

export const fetchProfissionalAtendimentosList = useApi
  ? api.fetchProfissionalAtendimentosList
  : mock.fetchProfissionalAtendimentosList

export const fetchProfissionalAtendimentoDetail = useApi
  ? api.fetchProfissionalAtendimentoDetail
  : mock.fetchProfissionalAtendimentoDetail

export async function fetchProfissionalConsultaSessao(accessToken: string, codigo: string) {
  if (useMockForSession(codigo)) {
    return mock.fetchProfissionalConsultaSessao(accessToken, codigo)
  }
  return api.fetchProfissionalConsultaSessao(accessToken, codigo)
}

export async function iniciarProfissionalConsultaPorCodigo(accessToken: string, codigo: string) {
  if (useMockForSession(codigo)) {
    return mock.iniciarProfissionalConsultaPorCodigo(accessToken, codigo)
  }
  return api.iniciarProfissionalConsultaPorCodigo(accessToken, codigo)
}

export async function fetchProfissionalConsultaVideoToken(accessToken: string, codigo: string) {
  if (useMockForSession(codigo)) {
    throw new ProfissionalAtendimentosApiError(
      'Teleconsulta por vídeo indisponível no atendimento demo (mock).',
      503,
      'SERVICE_UNAVAILABLE',
    )
  }
  if (!useApi) {
    throw new ProfissionalAtendimentosApiError(
      'Teleconsulta por vídeo indisponível no modo mock.',
      503,
      'SERVICE_UNAVAILABLE',
    )
  }
  return api.fetchProfissionalConsultaVideoToken(accessToken, codigo)
}

export async function enviarProfissionalMensagem(
  accessToken: string,
  consultaId: string,
  conteudo: string,
) {
  if (useMockForSession(consultaId)) {
    return mock.enviarProfissionalMensagem(accessToken, consultaId, conteudo)
  }
  return api.enviarProfissionalMensagem(accessToken, consultaId, conteudo)
}

export async function fetchProfissionalMensagens(accessToken: string, consultaId: string) {
  if (useMockForSession(consultaId)) {
    return mock.fetchProfissionalMensagens(accessToken, consultaId)
  }
  if (!useApi) {
    const sessao = await mock.fetchProfissionalConsultaSessao(accessToken, consultaId)
    return sessao.mensagens
  }
  return api.fetchProfissionalMensagens(accessToken, consultaId)
}

export async function uploadProfissionalMensagemAnexo(
  accessToken: string,
  consultaId: string,
  file: File,
) {
  if (useMockForSession(consultaId) || !useApi) return undefined
  return api.uploadProfissionalMensagemAnexo(accessToken, consultaId, file)
}

export async function salvarProfissionalNotaProntuario(
  accessToken: string,
  consultaId: string,
  nota: string,
) {
  if (useMockForSession(consultaId)) {
    return mock.salvarProfissionalNotaProntuario(accessToken, consultaId, nota)
  }
  return api.salvarProfissionalNotaProntuario(accessToken, consultaId, nota)
}

export async function emitirProfissionalReceita(
  accessToken: string,
  consultaId: string,
  payload: Parameters<typeof api.emitirProfissionalReceita>[2],
) {
  if (useMockForSession(consultaId)) {
    return mock.emitirProfissionalReceitaMock(accessToken, consultaId, payload)
  }
  return api.emitirProfissionalReceita(accessToken, consultaId, payload)
}

export async function emitirProfissionalPedidoExame(
  accessToken: string,
  consultaId: string,
  payload: Parameters<typeof api.emitirProfissionalPedidoExame>[2],
) {
  if (useMockForSession(consultaId)) {
    return mock.emitirProfissionalPedidoExameMock(accessToken, consultaId, payload)
  }
  return api.emitirProfissionalPedidoExame(accessToken, consultaId, payload)
}

export async function emitirProfissionalAtestado(
  accessToken: string,
  consultaId: string,
  payload: Parameters<typeof api.emitirProfissionalAtestado>[2],
) {
  if (useMockForSession(consultaId)) {
    return mock.emitirProfissionalAtestadoMock(accessToken, consultaId, payload)
  }
  return api.emitirProfissionalAtestado(accessToken, consultaId, payload)
}

export async function fetchProfissionalDocumentoDownloadUrl(
  accessToken: string,
  consultaId: string,
  documentoId: string,
) {
  if (useMockForSession(consultaId) || !useApi) return ''
  return api.fetchProfissionalDocumentoDownloadUrl(accessToken, consultaId, documentoId)
}

export const registrarProfissionalPrescricao = useApi
  ? api.registrarProfissionalPrescricao
  : mock.registrarProfissionalPrescricao

export const registrarProfissionalSolicitacaoExame = useApi
  ? api.registrarProfissionalSolicitacaoExame
  : mock.registrarProfissionalSolicitacaoExame

export const registrarProfissionalAnexoDocumento = useApi
  ? api.registrarProfissionalAnexoDocumento
  : mock.registrarProfissionalAnexoDocumento

export async function uploadProfissionalAnexo(
  accessToken: string,
  consultaId: string,
  file: File,
) {
  if (useMockForSession(consultaId)) {
    return mock.uploadProfissionalAnexo(accessToken, consultaId, file)
  }
  return api.uploadProfissionalAnexo(accessToken, consultaId, file)
}

export async function removerProfissionalAnexo(
  accessToken: string,
  consultaId: string,
  documentoId: string,
) {
  if (useMockForSession(consultaId)) {
    return mock.removerProfissionalAnexo(accessToken, consultaId, documentoId)
  }
  return api.removerProfissionalAnexo(accessToken, consultaId, documentoId)
}

export async function finalizarProfissionalAtendimento(
  accessToken: string,
  consultaId: string,
  payload: Parameters<typeof api.finalizarProfissionalAtendimento>[2],
) {
  if (useMockForSession(consultaId)) {
    return mock.finalizarProfissionalAtendimento(accessToken, consultaId, payload)
  }
  return api.finalizarProfissionalAtendimento(accessToken, consultaId, payload)
}

export async function fetchPublicExamCatalog(accessToken: string) {
  if (!useApi) return mock.fetchPublicExamCatalog()
  return api.fetchPublicExamCatalog(accessToken)
}

export const isProfissionalAtendimentosApiError = useApi
  ? api.isProfissionalAtendimentosApiError
  : mock.isProfissionalAtendimentosApiError

export const mapProfissionalSessaoToAttendanceSession = useApi
  ? api.mapProfissionalSessaoToAttendanceSession
  : mock.mapProfissionalSessaoToAttendanceSession

export const mapIssuedDocument = useApi ? api.mapIssuedDocument : mock.mapIssuedDocument

export const mapProfissionalMensagensToChat = useApi
  ? api.mapProfissionalMensagensToChat
  : mock.mapProfissionalMensagensToChat

export const mapHistoricoToRecordNotes = useApi
  ? api.mapHistoricoToRecordNotes
  : mock.mapHistoricoToRecordNotes

export const formatPatientAgeGender = useApi
  ? api.formatPatientAgeGender
  : mock.formatPatientAgeGender
