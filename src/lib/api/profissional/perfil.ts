import type { ProfissionalPerfil } from '../../../types/profissionalPerfil'
import { API_BASE_URL } from '../config'
import { apiFetch, ApiError } from '../http'

export class ProfissionalPerfilApiError extends ApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, code)
    this.name = 'ProfissionalPerfilApiError'
  }
}

function mapApiError(error: unknown, fallbackMessage: string): ProfissionalPerfilApiError {
  if (error instanceof ApiError) {
    return new ProfissionalPerfilApiError(error.message, error.status, error.code)
  }
  return new ProfissionalPerfilApiError(fallbackMessage, 0)
}

export function isProfissionalPerfilApiError(error: unknown): error is ProfissionalPerfilApiError {
  return error instanceof ProfissionalPerfilApiError
}

export async function fetchProfissionalPerfil(accessToken: string): Promise<ProfissionalPerfil> {
  try {
    return await apiFetch<ProfissionalPerfil>('/profissional/perfil', { accessToken })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar seu perfil.')
  }
}

export async function patchProfissionalPerfil(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<ProfissionalPerfil> {
  try {
    return await apiFetch<ProfissionalPerfil>('/profissional/perfil', {
      method: 'PATCH',
      accessToken,
      json: payload,
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível salvar seu perfil.')
  }
}

export async function uploadProfissionalPerfilFoto(
  accessToken: string,
  fotoDataUrl: string,
): Promise<{ avatarUrl: string }> {
  try {
    return await apiFetch<{ avatarUrl: string }>('/profissional/perfil/foto', {
      method: 'PUT',
      accessToken,
      json: { fotoDataUrl },
    })
  } catch (error) {
    throw mapApiError(error, 'Não foi possível atualizar a foto.')
  }
}

export async function fetchProfissionalDocumentoPreview(
  accessToken: string,
  documentoId: string,
): Promise<{ previewUrl: string; previewType: 'image' | 'pdf' }> {
  try {
    return await apiFetch<{ previewUrl: string; previewType: 'image' | 'pdf' }>(
      `/profissional/perfil/documentos/${encodeURIComponent(documentoId)}/preview`,
      { accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível carregar o documento.')
  }
}

export async function replaceProfissionalDocumento(
  accessToken: string,
  documentoId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ documento: ProfissionalPerfil['documents'][number] }> {
  const form = new FormData()
  form.append('file', file, file.name)

  try {
    onProgress?.(10)
    const response = await fetch(
      `${API_BASE_URL}/profissional/perfil/documentos/${encodeURIComponent(documentoId)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
        credentials: 'include',
      },
    )
    onProgress?.(90)

    const text = await response.text()
    let body: { error?: string; code?: string; documento?: ProfissionalPerfil['documents'][number] } | null =
      null
    if (text) {
      try {
        body = JSON.parse(text) as typeof body
      } catch {
        body = null
      }
    }

    if (!response.ok) {
      throw new ProfissionalPerfilApiError(
        body?.error ?? 'Não foi possível enviar o documento.',
        response.status,
        body?.code,
      )
    }

    onProgress?.(100)
    if (!body?.documento) {
      throw new ProfissionalPerfilApiError('Resposta inválida do servidor.', response.status)
    }
    return { documento: body.documento }
  } catch (error) {
    if (error instanceof ProfissionalPerfilApiError) throw error
    throw mapApiError(error, 'Não foi possível enviar o documento.')
  }
}

export async function vincularProfissionalCertificadoConselho(accessToken: string) {
  try {
    return await apiFetch<{ certificadoDigital: ProfissionalPerfil['certificadoDigital'] }>(
      '/profissional/perfil/certificado/conselho',
      { method: 'POST', accessToken },
    )
  } catch (error) {
    throw mapApiError(error, 'Não foi possível vincular o certificado.')
  }
}

export async function uploadProfissionalCertificadoA1(
  accessToken: string,
  file: File,
  password: string,
): Promise<{ certificadoDigital: ProfissionalPerfil['certificadoDigital'] }> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('password', password)

  try {
    const response = await fetch(`${API_BASE_URL}/profissional/perfil/certificado/a1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
      credentials: 'include',
    })

    const text = await response.text()
    let body: {
      error?: string
      code?: string
      certificadoDigital?: ProfissionalPerfil['certificadoDigital']
    } | null = null
    if (text) {
      try {
        body = JSON.parse(text) as typeof body
      } catch {
        body = null
      }
    }

    if (!response.ok) {
      throw new ProfissionalPerfilApiError(
        body?.error ?? 'Não foi possível enviar o certificado.',
        response.status,
        body?.code,
      )
    }

    if (!body?.certificadoDigital) {
      throw new ProfissionalPerfilApiError('Resposta inválida do servidor.', response.status)
    }

    return { certificadoDigital: body.certificadoDigital }
  } catch (error) {
    if (error instanceof ProfissionalPerfilApiError) throw error
    throw mapApiError(error, 'Não foi possível enviar o certificado.')
  }
}
