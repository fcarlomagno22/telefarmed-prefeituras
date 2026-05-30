import type { ProfissionalPerfilDocumentKind } from '../../../types/profissionalPerfil'

export const profissionalPerfilDocumentKindHints: Record<ProfissionalPerfilDocumentKind, string> = {
  crm: 'Registro ativo no conselho regional da sua profissão.',
  identidade: 'RG, CNH ou outro documento oficial com foto.',
  comprovante: 'Comprovante de residência emitido nos últimos 90 dias.',
  contrato: 'Contrato de prestação de serviços ou vínculo com a operadora.',
  outro: 'Diploma, certificados ou documentos complementares.',
}

export function formatProfissionalPerfilDocumentDateTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function getProfissionalPerfilDocumentExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? extension.toUpperCase() : 'ARQ'
}

export function isProfissionalPerfilDocumentPreviewable(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension)
}
