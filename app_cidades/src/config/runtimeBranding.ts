import { fallbackBranding } from './fallbackBranding'

export type RuntimeBranding = {
  logoUrl: string | null
  loginBackgroundUrl: string | null
  faviconUrl: string | null
  corPrimaria: string
  municipalityName: string
}

let currentBranding: RuntimeBranding = { ...fallbackBranding }

export function syncRuntimeBranding(branding: RuntimeBranding): void {
  currentBranding = branding
}

export function getRuntimeBranding(): RuntimeBranding {
  return currentBranding
}
