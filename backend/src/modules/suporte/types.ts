export type SupportMessageAttachment = {
  id: string
  name: string
  type: 'pdf' | 'image'
  url: string
  size: number
}

export type PortalSuporteVariant = 'ubt' | 'prefeitura' | 'profissional'

export type PortalActor = {
  variant: PortalSuporteVariant
  userId: string
  nome: string
  funcao: string
  entidadeId?: string
  unitId?: string
}

export type AdminActor = {
  id: string
  nome: string
}

export type ParsedSuporteFile = {
  buffer: Buffer
  mimeType: string
  fileName: string
}

export type ParsedSuporteMultipart = {
  fields: Record<string, string>
  files: ParsedSuporteFile[]
}
