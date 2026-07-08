export type VdPublicTenantBranding = {
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  nomeMarca: string | null
  terminologia: Record<string, string>
  tipoEntidade: string
}

export type VdPublicTenantResponse = {
  portalKind: 'vd'
  kind: 'vd'
  slug: string
  entidadeId: string | null
  ubtId: string | null
  vdHostSlug: string | null
  branding: VdPublicTenantBranding
  loginPath: string
  publicUrl: string | null
}

export type VdTenantStatus = 'idle' | 'loading' | 'ready' | 'not_found' | 'error'
