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

/** Branding da entidade retornado pelo backend nos portais (login, /me, /entidade/branding). */
export type EntidadeBrandingFields = {
  entidadeNomeExibicao: string
  entidadeSubtitulo: string
  entidadeTipo: TipoEntidade
  nomeMarca: string | null
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  terminologia: EntidadeTerminologia
}

/** Branding público (sem autenticação) em GET /public/tenant. */
export type EntidadeBrandingPublic = EntidadeBrandingFields

export type EntidadeLogoSignedUrlResponse = {
  logoUrl: string | null
  expiresInSeconds: number
}

const TERMINOLOGY_PREFEITURA: EntidadeTerminologia = {
  rede: 'rede municipal',
  gestao: 'gestão municipal',
  portal_gestao: 'portal',
  contrato: 'contrato municipal',
  operador_plataforma: 'operadora da plataforma',
  satisfacao_publico: 'satisfação do cidadão',
}

/** Defaults para mock/offline quando a API ainda não envia branding. */
export function buildDefaultEntidadeBranding(input: {
  nomeExibicao: string
  subtitulo?: string
  tipo?: TipoEntidade
}): EntidadeBrandingFields {
  const subtitulo = input.subtitulo?.trim() || 'Prefeitura Municipal'
  return {
    entidadeNomeExibicao: input.nomeExibicao.trim() || 'Entidade',
    entidadeSubtitulo: subtitulo,
    entidadeTipo: input.tipo ?? 'prefeitura',
    nomeMarca: null,
    logoUrl: null,
    loginBackgroundUrl: null,
    faviconUrl: null,
    corPrimaria: '#ff6b00',
    terminologia: { ...TERMINOLOGY_PREFEITURA },
  }
}
