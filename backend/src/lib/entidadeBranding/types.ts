export const TIPO_ENTIDADE_VALUES = ['prefeitura', 'santa_casa', 'generico'] as const

export type TipoEntidade = (typeof TIPO_ENTIDADE_VALUES)[number]

export const ENTIDADE_TERMINOLOGIA_KEYS = [
  'rede',
  'gestao',
  'portal_gestao',
  'contrato',
  'operador_plataforma',
  'satisfacao_publico',
] as const

export type EntidadeTerminologiaKey = (typeof ENTIDADE_TERMINOLOGIA_KEYS)[number]

export type EntidadeTerminologia = Record<EntidadeTerminologiaKey, string>

/** Campos de branding expostos nos portais prefeitura e UBT. */
export type EntidadeBrandingPublic = {
  entidadeNomeExibicao: string
  entidadeSubtitulo: string
  entidadeTipo: TipoEntidade
  /** Nome de marca nos portais/PDFs; null = usar nome_exibicao ou marca da plataforma no cliente. */
  nomeMarca: string | null
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  terminologia: EntidadeTerminologia
}

export type EntidadeLogoSignedUrlResponse = {
  logoUrl: string | null
  expiresInSeconds: number
}

export type EntidadeBrandingRow = {
  id: string
  nome_exibicao: string
  subtitulo: string
  tipo_entidade: TipoEntidade
  cor_primaria: string | null
  nome_marca: string | null
  logo_hue: number
  logo_storage_path: string | null
  login_background_storage_path: string | null
  favicon_storage_path: string | null
  terminologia: unknown
}
