import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/atendimentos'
import * as mock from '../../mockServices/profissional/atendimentos'

const useApi = isBackendApiEnabled()

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

export const fetchProfissionalConsultaSessao = useApi
  ? api.fetchProfissionalConsultaSessao
  : mock.fetchProfissionalConsultaSessao

export const iniciarProfissionalConsultaPorCodigo = useApi
  ? api.iniciarProfissionalConsultaPorCodigo
  : mock.iniciarProfissionalConsultaPorCodigo

export const fetchProfissionalConsultaVideoToken = useApi
  ? api.fetchProfissionalConsultaVideoToken
  : async (_accessToken: string, _codigo: string) => {
      throw new ProfissionalAtendimentosApiError(
        'Teleconsulta por vídeo indisponível no modo mock.',
        503,
        'SERVICE_UNAVAILABLE',
      )
    }

export const enviarProfissionalMensagem = useApi
  ? api.enviarProfissionalMensagem
  : mock.enviarProfissionalMensagem

export const fetchProfissionalMensagens = useApi
  ? api.fetchProfissionalMensagens
  : async (accessToken: string, consultaId: string) => {
      const sessao = await mock.fetchProfissionalConsultaSessao(accessToken, consultaId)
      return sessao.mensagens
    }

export const uploadProfissionalMensagemAnexo = useApi
  ? api.uploadProfissionalMensagemAnexo
  : async (_accessToken: string, _consultaId: string, _file: File) => undefined

export const salvarProfissionalNotaProntuario = useApi
  ? api.salvarProfissionalNotaProntuario
  : mock.salvarProfissionalNotaProntuario

export const emitirProfissionalReceita = useApi
  ? api.emitirProfissionalReceita
  : mock.emitirProfissionalReceitaMock
export const emitirProfissionalPedidoExame = useApi
  ? api.emitirProfissionalPedidoExame
  : mock.emitirProfissionalPedidoExameMock
export const emitirProfissionalAtestado = useApi
  ? api.emitirProfissionalAtestado
  : mock.emitirProfissionalAtestadoMock
export const fetchProfissionalDocumentoDownloadUrl = useApi
  ? api.fetchProfissionalDocumentoDownloadUrl
  : async () => ''

export const registrarProfissionalPrescricao = useApi
  ? api.registrarProfissionalPrescricao
  : mock.registrarProfissionalPrescricao

export const registrarProfissionalSolicitacaoExame = useApi
  ? api.registrarProfissionalSolicitacaoExame
  : mock.registrarProfissionalSolicitacaoExame

export const registrarProfissionalAnexoDocumento = useApi
  ? api.registrarProfissionalAnexoDocumento
  : mock.registrarProfissionalAnexoDocumento

export const uploadProfissionalAnexo = useApi
  ? api.uploadProfissionalAnexo
  : mock.uploadProfissionalAnexo

export const removerProfissionalAnexo = useApi
  ? api.removerProfissionalAnexo
  : mock.removerProfissionalAnexo

export const finalizarProfissionalAtendimento = useApi
  ? api.finalizarProfissionalAtendimento
  : mock.finalizarProfissionalAtendimento

export const fetchPublicExamCatalog = useApi
  ? api.fetchPublicExamCatalog
  : async (_accessToken: string) => mock.fetchPublicExamCatalog()

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
