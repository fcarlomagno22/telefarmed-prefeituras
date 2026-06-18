import type { EntidadeTerminologia, TipoEntidade } from './entidadeBranding'

export type TenantHostKind = 'gestao' | 'ubt' | 'platform'

export type PublicTenantPortalKind = 'admin' | 'profissional' | 'prefeitura' | 'ubt'

export type PublicTenantBranding = {
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  nomeMarca: string | null
  terminologia: EntidadeTerminologia
  tipoEntidade: TipoEntidade
}

export type PublicTenantResponse = {
  portalKind: PublicTenantPortalKind
  kind: TenantHostKind
  slug: string
  entidadeId: string | null
  ubtId: string | null
  branding: PublicTenantBranding
  loginPath: string
  publicUrl: string
}

export type TenantHostStatus = 'idle' | 'loading' | 'ready' | 'not_found' | 'error'
