import { compressSelfieDataUrl, dataUrlToBlob } from '../../../utils/image/compressSelfieDataUrl'
import { API_BASE_URL } from '../config'
import { ApiError, apiFetch } from '../http'
import type { MedicoCadastroDocumentUploads, MedicoCadastroFormValues } from '../../../types/medicoCadastro'
import type {
  ProfissionalFinalizarCadastroEmpresaData,
  ProfissionalFinalizarCadastroFormValues,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../../../types/profissionalFinalizarCadastro'

export class ProfissionalCadastroApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalCadastroApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalCadastroApiError(
  error: unknown,
): error is ProfissionalCadastroApiError {
  return error instanceof ProfissionalCadastroApiError
}

export type SubmitProfissionalCadastroProgress = {
  percent: number
  message: string
}

const SUBMIT_PROGRESS_MESSAGES: Array<{ upTo: number; message: string }> = [
  { upTo: 12, message: 'Preparando seus dados com cuidado...' },
  { upTo: 28, message: 'Verificando suas informações profissionais...' },
  { upTo: 45, message: 'Enviando seus documentos com segurança...' },
  { upTo: 62, message: 'Subindo comprovantes e registros...' },
  { upTo: 78, message: 'Validando arquivos enviados...' },
  { upTo: 92, message: 'Quase lá! Finalizando o envio...' },
  { upTo: 100, message: 'Concluindo sua candidatura...' },
]

export function getSubmitProgressMessage(percent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  const match = SUBMIT_PROGRESS_MESSAGES.find((item) => clamped <= item.upTo)
  return match?.message ?? SUBMIT_PROGRESS_MESSAGES[SUBMIT_PROGRESS_MESSAGES.length - 1]!.message
}

function buildSubmitFormData(input: {
  values: MedicoCadastroFormValues
  documents: MedicoCadastroDocumentUploads
}): FormData {
  const formData = new FormData()
  formData.append('dados', JSON.stringify(input.values))

  for (const [fieldId, file] of Object.entries(input.documents)) {
    if (file) {
      formData.append(fieldId, file, file.name)
    }
  }

  return formData
}

export async function apiSubmitProfissionalCadastro(
  input: {
    values: MedicoCadastroFormValues
    documents: MedicoCadastroDocumentUploads
  },
  onProgress?: (progress: SubmitProfissionalCadastroProgress) => void,
): Promise<{ candidaturaId: string }> {
  const formData = buildSubmitFormData(input)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/profissional/cadastro`)
    xhr.withCredentials = true
    xhr.responseType = 'text'

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return
      const uploadPercent = Math.round((event.loaded / event.total) * 88)
      onProgress({
        percent: uploadPercent,
        message: getSubmitProgressMessage(uploadPercent),
      })
    }

    xhr.onload = () => {
      const text = xhr.responseText
      let payload: { error?: string; code?: string; candidaturaId?: string } | null = null

      if (text) {
        try {
          payload = JSON.parse(text) as {
            error?: string
            code?: string
            candidaturaId?: string
          }
        } catch {
          payload = null
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({
          percent: 100,
          message: getSubmitProgressMessage(100),
        })

        if (!payload?.candidaturaId) {
          reject(
            new ProfissionalCadastroApiError(
              'Resposta inválida do servidor.',
              xhr.status,
              'INVALID_RESPONSE',
            ),
          )
          return
        }

        resolve({ candidaturaId: payload.candidaturaId })
        return
      }

      reject(
        new ProfissionalCadastroApiError(
          payload?.error ?? 'Não foi possível enviar sua candidatura. Tente novamente.',
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

    xhr.onabort = () => {
      reject(
        new ProfissionalCadastroApiError('Envio cancelado.', 0, 'ABORTED'),
      )
    }

    xhr.onloadstart = () => {
      onProgress?.({
        percent: 2,
        message: getSubmitProgressMessage(2),
      })
    }

    xhr.send(formData)
  })
}

function mapCadastroApiError(error: unknown, fallbackMessage: string): ProfissionalCadastroApiError {
  if (error instanceof ApiError) {
    if (error.status === 413) {
      return new ProfissionalCadastroApiError(
        'A foto de identificação é grande demais. Tire a selfie novamente e tente outra vez.',
        error.status,
        error.code,
      )
    }
    return new ProfissionalCadastroApiError(error.message, error.status, error.code)
  }
  return new ProfissionalCadastroApiError(fallbackMessage, 0)
}

export async function apiValidateProfissionalAccessCode(
  accessCode: string,
): Promise<ProfissionalFinalizarCadastroProfissionalData> {
  const digits = accessCode.replace(/\D/g, '')
  try {
    const data = await apiFetch<{ profissional: ProfissionalFinalizarCadastroProfissionalData }>(
      `/profissional/cadastro/validar-codigo/${digits}`,
    )
    return data.profissional
  } catch (error) {
    throw mapCadastroApiError(error, 'Código de acesso inválido ou expirado.')
  }
}

export async function apiConsultarProfissionalCnpj(
  cnpj: string,
): Promise<ProfissionalFinalizarCadastroEmpresaData> {
  const digits = cnpj.replace(/\D/g, '')
  try {
    const data = await apiFetch<{ empresa: ProfissionalFinalizarCadastroEmpresaData }>(
      `/profissional/cadastro/consultar-cnpj/${digits}`,
    )
    return data.empresa
  } catch (error) {
    throw mapCadastroApiError(error, 'Não foi possível consultar o CNPJ. Tente novamente.')
  }
}

export async function apiFinalizeProfissionalCadastro(input: {
  values: ProfissionalFinalizarCadastroFormValues
  empresa: ProfissionalFinalizarCadastroEmpresaData
}): Promise<{ profissionalId: string }> {
  try {
    const selfiePhotoDataUrl = await compressSelfieDataUrl(input.values.selfiePhotoDataUrl)
    const selfieBlob = dataUrlToBlob(selfiePhotoDataUrl)

    const uploadPrep = await apiFetch<{
      signedUrl: string
      storagePath: string
    }>('/profissional/cadastro/finalizar-cadastro/selfie-upload-url', {
      method: 'POST',
      json: { accessCode: input.values.accessCode },
    })

    const uploadResponse = await fetch(uploadPrep.signedUrl, {
      method: 'PUT',
      body: selfieBlob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    })

    if (!uploadResponse.ok) {
      throw new ProfissionalCadastroApiError(
        'Não foi possível enviar a selfie. Tire a foto novamente e tente outra vez.',
        uploadResponse.status,
        'SELFIE_UPLOAD_FAILED',
      )
    }

    const { selfiePhotoDataUrl: _selfie, ...valuesWithoutSelfie } = input.values

    return await apiFetch<{ profissionalId: string }>('/profissional/cadastro/finalizar-cadastro', {
      method: 'POST',
      json: {
        values: valuesWithoutSelfie,
        empresa: {
          ...input.empresa,
          municipio: input.empresa.cidade,
        },
        selfieStoragePath: uploadPrep.storagePath,
      },
    })
  } catch (error) {
    throw mapCadastroApiError(error, 'Não foi possível finalizar o cadastro. Tente novamente.')
  }
}
