import { API_BASE_URL } from '../config'
import { ApiError, apiFetch } from '../http'
import type {
  MinhaCandidatura,
  MinhaCandidaturaAccess,
  MinhaCandidaturaDataCorrection,
} from '../../../types/minhaCandidatura'
import { ProfissionalCadastroApiError } from './cadastro'

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalCadastroApiError {
  if (error instanceof ApiError) {
    return new ProfissionalCadastroApiError(error.message, error.status, error.code)
  }
  return new ProfissionalCadastroApiError(fallbackMessage, 0)
}

export async function apiConsultarMinhaCandidatura(
  access: MinhaCandidaturaAccess,
): Promise<MinhaCandidatura> {
  try {
    const data = await apiFetch<{ candidatura: MinhaCandidatura }>(
      '/profissional/cadastro/minha-candidatura/consultar',
      {
        method: 'POST',
        json: access,
      },
    )
    return data.candidatura
  } catch (error) {
    throw mapApiError(error, 'Não foi possível consultar sua candidatura.')
  }
}

export async function apiCorrigirDadosMinhaCandidatura(input: {
  access: MinhaCandidaturaAccess
  dados: MinhaCandidaturaDataCorrection
}): Promise<MinhaCandidatura> {
  try {
    const data = await apiFetch<{ candidatura: MinhaCandidatura }>(
      '/profissional/cadastro/minha-candidatura/corrigir-dados',
      {
        method: 'POST',
        json: {
          cpf: input.access.cpf,
          birthDate: input.access.birthDate,
          ...input.dados,
        },
      },
    )
    return data.candidatura
  } catch (error) {
    throw mapApiError(error, 'Não foi possível enviar as correções.')
  }
}

export async function apiEnviarCorrecoesMinhaCandidatura(input: {
  access: MinhaCandidaturaAccess
  dados?: MinhaCandidaturaDataCorrection
  documentos: Array<{ documentoId: string; file: File }>
}): Promise<MinhaCandidatura> {
  const formData = new FormData()
  formData.append('cpf', input.access.cpf)
  formData.append('birthDate', input.access.birthDate)

  if (input.dados?.email) formData.append('email', input.dados.email)
  if (input.dados?.telefone) formData.append('telefone', input.dados.telefone)
  if (input.dados?.conselhoNumero) formData.append('conselhoNumero', input.dados.conselhoNumero)
  if (input.dados?.conselhoUf) formData.append('conselhoUf', input.dados.conselhoUf)
  if (input.dados?.rqe !== undefined) formData.append('rqe', input.dados.rqe)

  for (const doc of input.documentos) {
    formData.append(`documento_${doc.documentoId}`, doc.file, doc.file.name)
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/profissional/cadastro/minha-candidatura/enviar-correcoes`)
    xhr.withCredentials = true
    xhr.responseType = 'text'

    xhr.onload = () => {
      const text = xhr.responseText
      let payload: { error?: string; code?: string; candidatura?: MinhaCandidatura } | null = null

      if (text) {
        try {
          payload = JSON.parse(text) as {
            error?: string
            code?: string
            candidatura?: MinhaCandidatura
          }
        } catch {
          payload = null
        }
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.candidatura) {
        resolve(payload.candidatura)
        return
      }

      reject(
        new ProfissionalCadastroApiError(
          payload?.error ?? 'Não foi possível enviar as correções.',
          xhr.status || 500,
          payload?.code,
        ),
      )
    }

    xhr.onerror = () => {
      reject(
        new ProfissionalCadastroApiError(
          'Falha de conexão. Verifique sua internet e tente novamente.',
          0,
          'NETWORK_ERROR',
        ),
      )
    }

    xhr.send(formData)
  })
}

export async function apiReenviarDocumentoMinhaCandidatura(input: {
  access: MinhaCandidaturaAccess
  documentoId: string
  file: File
}): Promise<MinhaCandidatura> {
  const formData = new FormData()
  formData.append('cpf', input.access.cpf)
  formData.append('birthDate', input.access.birthDate)
  formData.append('arquivo', input.file, input.file.name)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'POST',
      `${API_BASE_URL}/profissional/cadastro/minha-candidatura/documentos/${input.documentoId}/reenviar`,
    )
    xhr.withCredentials = true
    xhr.responseType = 'text'

    xhr.onload = () => {
      const text = xhr.responseText
      let payload: { error?: string; code?: string; candidatura?: MinhaCandidatura } | null = null

      if (text) {
        try {
          payload = JSON.parse(text) as {
            error?: string
            code?: string
            candidatura?: MinhaCandidatura
          }
        } catch {
          payload = null
        }
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.candidatura) {
        resolve(payload.candidatura)
        return
      }

      reject(
        new ProfissionalCadastroApiError(
          payload?.error ?? 'Não foi possível reenviar o documento.',
          xhr.status || 500,
          payload?.code,
        ),
      )
    }

    xhr.onerror = () => {
      reject(
        new ProfissionalCadastroApiError(
          'Falha de conexão. Verifique sua internet e tente novamente.',
          0,
          'NETWORK_ERROR',
        ),
      )
    }

    xhr.send(formData)
  })
}
