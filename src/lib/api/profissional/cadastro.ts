import { compressSelfieDataUrl, dataUrlToBlob } from '../../../utils/image/compressSelfieDataUrl'
import { isMedicoCadastroMedicinaFormation } from '../../../config/medicoCadastroForm'
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

function sanitizeCandidaturaDados(values: MedicoCadastroFormValues): MedicoCadastroFormValues {
  return {
    ...values,
    medicalSpecialties: isMedicoCadastroMedicinaFormation(values.formation)
      ? values.medicalSpecialties.filter((item) => item.specialty.trim().length > 0)
      : [],
  }
}

const REQUIRED_CANDIDATURA_DOCUMENT_IDS = [
  'doc-conselho',
  'doc-identidade',
  'doc-profissional',
  'doc-endereco',
] as const

function resolveDocumentMimeType(file: File): string {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  return 'image/jpeg'
}

export async function apiSubmitProfissionalCadastro(
  input: {
    values: MedicoCadastroFormValues
    documents: MedicoCadastroDocumentUploads
  },
  onProgress?: (progress: SubmitProfissionalCadastroProgress) => void,
): Promise<{ candidaturaId: string }> {
  const documentEntries = REQUIRED_CANDIDATURA_DOCUMENT_IDS.flatMap((fieldId) => {
    const file = input.documents[fieldId]
    return file instanceof File ? ([[fieldId, file]] as const) : []
  })

  if (documentEntries.length !== REQUIRED_CANDIDATURA_DOCUMENT_IDS.length) {
    throw new ProfissionalCadastroApiError(
      'Envie todos os documentos obrigatórios.',
      400,
      'DOCUMENT_REQUIRED',
    )
  }

  const submissionId = crypto.randomUUID()
  const candidaturaDados = sanitizeCandidaturaDados(input.values)

  onProgress?.({
    percent: 4,
    message: getSubmitProgressMessage(4),
  })

  try {
    const uploadPrep = await apiFetch<{
      submissionId: string
      uploads: Array<{ fieldId: string; signedUrl: string; storagePath: string }>
    }>('/profissional/cadastro/documentos-upload-url', {
      method: 'POST',
      json: {
        submissionId,
        documentos: documentEntries.map(([fieldId, file]) => ({
          fieldId,
          fileName: file.name,
          mimeType: resolveDocumentMimeType(file),
        })),
      },
    })

    const uploadsByField = new Map(uploadPrep.uploads.map((upload) => [upload.fieldId, upload]))
    let uploadedCount = 0

    for (const [fieldId, file] of documentEntries) {
      const target = uploadsByField.get(fieldId)
      if (!target) {
        throw new ProfissionalCadastroApiError(
          'Não foi possível preparar o envio de um documento. Tente novamente.',
          400,
          'DOCUMENT_INVALID',
        )
      }

      const mimeType = resolveDocumentMimeType(file)
      const uploadResponse = await fetch(target.signedUrl, {
        method: 'PUT',
        body: file,
        ...(mimeType ? { headers: { 'Content-Type': mimeType } } : {}),
      })

      if (!uploadResponse.ok) {
        throw new ProfissionalCadastroApiError(
          uploadResponse.status === 413
            ? 'Um documento é grande demais. Use arquivos de até 8 MB.'
            : 'Não foi possível enviar um documento. Verifique os arquivos e tente novamente.',
          uploadResponse.status,
          'DOCUMENT_UPLOAD_FAILED',
        )
      }

      uploadedCount += 1
      const uploadPercent = 8 + Math.round((uploadedCount / documentEntries.length) * 72)
      onProgress?.({
        percent: uploadPercent,
        message: getSubmitProgressMessage(uploadPercent),
      })
    }

    onProgress?.({
      percent: 88,
      message: getSubmitProgressMessage(88),
    })

    const result = await apiFetch<{ candidaturaId: string }>('/profissional/cadastro', {
      method: 'POST',
      json: {
        submissionId: uploadPrep.submissionId,
        dados: candidaturaDados,
        documentos: documentEntries.map(([fieldId, file]) => {
          const target = uploadsByField.get(fieldId)
          if (!target) {
            throw new ProfissionalCadastroApiError(
              'Resposta inválida ao preparar documentos.',
              500,
              'INVALID_RESPONSE',
            )
          }

          return {
            fieldId,
            storagePath: target.storagePath,
            fileName: file.name,
            mimeType: resolveDocumentMimeType(file),
          }
        }),
      },
    })

    onProgress?.({
      percent: 100,
      message: getSubmitProgressMessage(100),
    })

    if (!result.candidaturaId) {
      throw new ProfissionalCadastroApiError(
        'Resposta inválida do servidor.',
        500,
        'INVALID_RESPONSE',
      )
    }

    return result
  } catch (error) {
    if (error instanceof ProfissionalCadastroApiError) {
      throw error
    }
    if (error instanceof ApiError && error.status === 413) {
      throw new ProfissionalCadastroApiError(
        'Os arquivos são grandes demais para envio. Use documentos de até 8 MB.',
        error.status,
        error.code,
      )
    }
    throw mapCadastroApiError(error, 'Não foi possível enviar sua candidatura. Tente novamente.')
  }
}

function mapCadastroApiError(error: unknown, fallbackMessage: string): ProfissionalCadastroApiError {
  if (error instanceof ApiError) {
    if (error.status === 413) {
      return new ProfissionalCadastroApiError(
        'Arquivo grande demais para envio. Reduza o tamanho e tente novamente.',
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
