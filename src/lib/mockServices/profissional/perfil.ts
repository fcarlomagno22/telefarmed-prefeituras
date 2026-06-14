import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import type { ProfissionalPerfil } from '../../../types/profissionalPerfil'
import { mockDelay } from '../delay'
import { simulateProfissionalCertificadoVinculo } from '../../../utils/profissional/simulateProfissionalCertificadoVinculo'
import { simulateProfissionalDocumentUpload } from '../../../utils/profissional/profissionalPerfilDocumentUpload'

export class ProfissionalPerfilApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalPerfilApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalPerfilApiError(error: unknown): error is ProfissionalPerfilApiError {
  return error instanceof ProfissionalPerfilApiError
}

let profileState: ProfissionalPerfil = structuredClone(profissionalLoggedProfile)

function cloneProfile(): ProfissionalPerfil {
  return structuredClone(profileState)
}

export async function fetchProfissionalPerfil(_accessToken: string): Promise<ProfissionalPerfil> {
  void _accessToken
  return mockDelay(cloneProfile())
}

export async function patchProfissionalPerfil(
  _accessToken: string,
  payload: Record<string, unknown>,
): Promise<ProfissionalPerfil> {
  void _accessToken

  const next = { ...profileState } as ProfissionalPerfil

  if (typeof payload.fullName === 'string') next.fullName = payload.fullName
  if (typeof payload.specialty === 'string') next.specialty = payload.specialty
  if (typeof payload.rqe === 'string') next.rqe = payload.rqe
  if (typeof payload.phone === 'string') next.phone = payload.phone
  if (typeof payload.professionalDescription === 'string') {
    next.professionalDescription = payload.professionalDescription
  }
  if (typeof payload.bio === 'string') next.professionalDescription = payload.bio
  if (typeof payload.professionalAddress === 'string') {
    next.professionalAddress = payload.professionalAddress
  }
  if (typeof payload.cpf === 'string') next.cpf = payload.cpf
  if (typeof payload.birthDate === 'string') next.birthDate = payload.birthDate
  if (typeof payload.conselhoRegistro === 'string') {
    next.conselhoRegistro = payload.conselhoRegistro
  }
  if (typeof payload.conselhoUf === 'string') next.conselhoUf = payload.conselhoUf
  if (typeof payload.fotoDataUrl === 'string') {
    next.avatarUrl = payload.fotoDataUrl
  }
  if (typeof payload.razaoSocial === 'string') next.empresa.razaoSocial = payload.razaoSocial
  if (typeof payload.cnpj === 'string') next.empresa.cnpj = payload.cnpj
  if (typeof payload.bankCode === 'string') next.bankAccount.bankCode = payload.bankCode
  if (typeof payload.agency === 'string') next.bankAccount.agency = payload.agency
  if (typeof payload.account === 'string') next.bankAccount.account = payload.account
  if (payload.accountType === 'corrente' || payload.accountType === 'poupanca') {
    next.bankAccount.accountType = payload.accountType
  }
  if (
    payload.pixKeyType === 'cpf' ||
    payload.pixKeyType === 'cnpj' ||
    payload.pixKeyType === 'telefone' ||
    payload.pixKeyType === 'email' ||
    payload.pixKeyType === 'aleatoria'
  ) {
    next.pixKeyType = payload.pixKeyType
  }
  if (typeof payload.pixKey === 'string') {
    next.empresa.pixKeys[next.pixKeyType] = payload.pixKey
  }

  profileState = next
  return mockDelay(cloneProfile())
}

export async function uploadProfissionalPerfilFoto(
  _accessToken: string,
  fotoDataUrl: string,
): Promise<{ avatarUrl: string }> {
  void _accessToken
  profileState = { ...profileState, avatarUrl: fotoDataUrl }
  return mockDelay({ avatarUrl: fotoDataUrl })
}

export async function fetchProfissionalDocumentoPreview(
  _accessToken: string,
  _documentoId: string,
): Promise<{ previewUrl: string; previewType: 'image' | 'pdf' }> {
  void _accessToken
  void _documentoId
  return mockDelay({ previewUrl: 'https://example.com/mock.pdf', previewType: 'pdf' })
}

export async function replaceProfissionalDocumento(
  _accessToken: string,
  documentoId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ documento: ProfissionalPerfil['documents'][number] }> {
  void _accessToken
  await simulateProfissionalDocumentUpload(onProgress)
  const documento = profileState.documents.find((item) => item.id === documentoId)
  if (!documento) {
    throw new ProfissionalPerfilApiError('Documento não encontrado.', 404, 'NOT_FOUND')
  }
  const updated = {
    ...documento,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    status: 'pendente' as const,
  }
  profileState = {
    ...profileState,
    documents: profileState.documents.map((item) => (item.id === documentoId ? updated : item)),
  }
  return mockDelay({ documento: updated })
}

export async function vincularProfissionalCertificadoConselho(_accessToken: string) {
  void _accessToken
  await simulateProfissionalCertificadoVinculo()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 2)
  const certificadoDigital = {
    modo: 'conselho_nuvem' as const,
    status: 'ativo' as const,
    updatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    emissorDescricao: 'Certificado CFM em nuvem · ICP-Brasil · VALID',
    arquivoNome: null,
    titularNome: profileState.fullName,
  }
  profileState = { ...profileState, certificadoDigital }
  return mockDelay({ certificadoDigital })
}

export async function uploadProfissionalCertificadoA1(
  _accessToken: string,
  file: File,
  _password: string,
): Promise<{ certificadoDigital: ProfissionalPerfil['certificadoDigital'] }> {
  void _accessToken
  void _password
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  const certificadoDigital = {
    modo: 'a1_arquivo' as const,
    status: 'ativo' as const,
    updatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    emissorDescricao: 'Certificado A1 · ICP-Brasil',
    arquivoNome: file.name,
    titularNome: profileState.fullName,
  }
  profileState = { ...profileState, certificadoDigital }
  return mockDelay({ certificadoDigital })
}
