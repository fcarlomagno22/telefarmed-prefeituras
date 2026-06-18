import type { EntidadeTerminologia, TipoEntidade } from '../entidadeBranding/types.js'

export type TenantKind = 'gestao' | 'ubt' | 'platform'

export type TenantBranding = {
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  nomeMarca: string | null
  terminologia: EntidadeTerminologia
  tipoEntidade: TipoEntidade
}

/** Resultado de resolveTenantByHost / resolveTenantBySlug. */
export type ResolvedTenant = {
  kind: TenantKind
  slug: string
  entidadeId?: string
  ubtId?: string
  branding: TenantBranding
}
