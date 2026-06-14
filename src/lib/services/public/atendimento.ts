import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/public/atendimento'
import {
  PublicAtendimentoApiError as MockPublicAtendimentoApiError,
  fetchPublicAvaliacaoSessao as mockFetchPublicAvaliacaoSessao,
  isPublicAtendimentoApiError as mockIsPublicAtendimentoApiError,
  registrarPublicAvaliacaoDetalhada as mockRegistrarPublicAvaliacaoDetalhada,
} from '../../mockServices/public/avaliacao'
import * as mockAtendimento from '../../mockServices/public/atendimento'

const useApi = isBackendApiEnabled()

export const PublicAtendimentoApiError = useApi
  ? api.PublicAtendimentoApiError
  : MockPublicAtendimentoApiError

export const isPublicAtendimentoApiError = useApi
  ? api.isPublicAtendimentoApiError
  : mockIsPublicAtendimentoApiError

export type PublicAvaliacaoSessao = api.PublicAvaliacaoSessao
export type PublicMensagem = api.PublicMensagemApi
export type PublicFilaStatus = api.PublicFilaStatusApi
export type PublicAtendimentoSessao = api.PublicAtendimentoSessaoApi
export type DocumentoVerificacao = api.DocumentoVerificacao

export async function fetchPublicAvaliacaoSessao(codigo: string) {
  if (useApi) {
    return api.apiFetchPublicAvaliacaoSessao(codigo)
  }
  return mockFetchPublicAvaliacaoSessao(codigo)
}

export async function registrarPublicAvaliacaoDetalhada(
  codigo: string,
  body: api.PublicAvaliacaoBody,
) {
  if (useApi) {
    return api.apiRegistrarPublicAvaliacao(codigo, body)
  }
  return mockRegistrarPublicAvaliacaoDetalhada(codigo, body)
}

export async function fetchPublicMensagens(codigo: string) {
  if (useApi) {
    return api.apiFetchPublicMensagens(codigo)
  }
  return mockAtendimento.fetchPublicMensagens(codigo)
}

export async function sendPublicMensagemPaciente(
  codigo: string,
  payload: { text: string } | { file: File; conteudo?: string },
) {
  if (useApi) {
    if ('text' in payload) {
      return api.apiEnviarPublicMensagem(codigo, payload.text)
    }
    return api.apiUploadPublicMensagemAnexo(codigo, payload.file, payload.conteudo)
  }

  if ('text' in payload) {
    return mockAtendimento.sendPublicMensagemPaciente(codigo, { text: payload.text })
  }

  const attachment = payload.file
  const type =
    attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf')
      ? ('pdf' as const)
      : ('image' as const)

  return mockAtendimento.sendPublicMensagemPaciente(codigo, {
    attachment: {
      url: URL.createObjectURL(attachment),
      name: attachment.name,
      size: attachment.size,
      type,
    },
  })
}

export async function fetchPublicDocumentos(codigo: string) {
  if (useApi) {
    return api.apiFetchPublicDocumentos(codigo)
  }
  const sessao = await mockAtendimento.fetchPublicAtendimentoSessao(codigo)
  return sessao.consultationDocuments.map((doc) => ({
    id: doc.id,
    kind: doc.type,
    title: doc.title,
    meta: doc.signedAtLabel ? `PDF • Assinado às ${doc.signedAtLabel}` : doc.type,
    fileName: `${doc.title}.pdf`,
    signedAtLabel: doc.signedAtLabel,
    downloadUrl: '#',
  }))
}

export async function fetchDocumentoVerificacao(codigo: string) {
  if (useApi) {
    return api.apiFetchDocumentoVerificacao(codigo)
  }
  return {
    valido: true,
    codigoVerificacao: codigo,
    tipo: 'receita',
    titulo: 'Receita médica (demonstração)',
    emitidoEm: new Date().toISOString(),
    emitidoEmLabel: 'Documento de demonstração',
    patientName: 'Paciente',
    doctorName: 'Dr. Demonstração',
    doctorCrm: 'CRM 00000/UF',
    doctorRqe: '',
    doctorSpecialty: 'Clínica geral',
    entidadeNome: 'Telefarmed',
    unitName: 'Teleatendimento',
    verificationUrl: `${window.location.origin}/verificar/${codigo}`,
    downloadUrl: null,
    hashSha256: null,
  } satisfies DocumentoVerificacao
}

export async function fetchPublicDocumentoDownloadUrl(codigo: string, documentId: string) {
  if (useApi) {
    return api.apiFetchPublicDocumentoDownloadUrl(codigo, documentId)
  }
  return '#'
}

export async function fetchPublicAtendimentoSessao(codigo: string) {
  if (useApi) {
    return api.apiFetchPublicAtendimentoSessao(codigo)
  }
  return mockAtendimento.fetchPublicAtendimentoSessao(codigo)
}

export async function fetchPublicConsultaVideoToken(codigo: string) {
  if (useApi) {
    return api.fetchPublicConsultaVideoToken(codigo)
  }
  throw new PublicAtendimentoApiError(
    'Teleconsulta por vídeo indisponível no modo mock.',
    503,
    'SERVICE_UNAVAILABLE',
  )
}

export async function fetchPublicFilaStatus(codigo: string) {
  if (useApi) {
    return api.apiFetchPublicFilaStatus(codigo)
  }
  return mockAtendimento.fetchPublicFilaStatus(codigo)
}

export async function registrarPacienteEntradaSalaAtendimento(codigo: string) {
  if (useApi) {
    return api.apiRegistrarPacienteEntradaSalaAtendimento(codigo)
  }
  return Promise.resolve()
}

export const mapPublicMensagensToChat = useApi
  ? api.mapPublicMensagensToChat
  : mockAtendimento.mapPublicMensagensToChat

export const mapPublicDocumentosToPanel = useApi
  ? api.mapPublicDocumentosToPanel
  : (docs: Awaited<ReturnType<typeof fetchPublicDocumentos>>) =>
      docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        meta: doc.meta,
        downloadUrl: doc.downloadUrl,
        downloadLabel: 'Baixar documento',
        iconClass: 'bg-gray-50 text-gray-500',
      }))

export const mapPublicSessaoToAttendanceSession = useApi
  ? api.mapPublicSessaoToAttendanceSession
  : mockAtendimento.mapPublicSessaoToAttendanceSession
