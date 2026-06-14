import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/minhaCandidatura'
import type {
  MinhaCandidatura,
  MinhaCandidaturaAccess,
  MinhaCandidaturaDataCorrection,
} from '../../../types/minhaCandidatura'

export async function consultarMinhaCandidatura(
  access: MinhaCandidaturaAccess,
): Promise<MinhaCandidatura> {
  if (!isBackendApiEnabled()) {
    throw new Error('Consulta de candidatura disponível apenas com a API ativa.')
  }
  return api.apiConsultarMinhaCandidatura(access)
}

export async function enviarCorrecoesMinhaCandidatura(input: {
  access: MinhaCandidaturaAccess
  dados?: MinhaCandidaturaDataCorrection
  documentos: Array<{ documentoId: string; file: File }>
}): Promise<MinhaCandidatura> {
  if (!isBackendApiEnabled()) {
    throw new Error('Envio de correções disponível apenas com a API ativa.')
  }
  return api.apiEnviarCorrecoesMinhaCandidatura(input)
}

export async function corrigirDadosMinhaCandidatura(input: {
  access: MinhaCandidaturaAccess
  dados: MinhaCandidaturaDataCorrection
}): Promise<MinhaCandidatura> {
  if (!isBackendApiEnabled()) {
    throw new Error('Correção de dados disponível apenas com a API ativa.')
  }
  return api.apiCorrigirDadosMinhaCandidatura(input)
}

export async function reenviarDocumentoMinhaCandidatura(input: {
  access: MinhaCandidaturaAccess
  documentoId: string
  file: File
}): Promise<MinhaCandidatura> {
  if (!isBackendApiEnabled()) {
    throw new Error('Reenvio de documentos disponível apenas com a API ativa.')
  }
  return api.apiReenviarDocumentoMinhaCandidatura(input)
}
