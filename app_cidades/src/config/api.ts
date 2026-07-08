import { env } from './env'

const DEFAULT_DEV_API_BASE_URL = 'http://localhost:3001/api/v1'

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.replace(/\/$/, '')
  if (trimmed.endsWith('/api/v1')) return trimmed
  return `${trimmed}/api/v1`
}

function isLocalDevHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')
}

function hasCollocatedApi(hostname: string): boolean {
  return hostname.toLowerCase().endsWith('telefarmed.com.br')
}

/** Base da API REST do backend Telefarmed (`EXPO_PUBLIC_API_URL` ou `/api/v1` no web). */
export function resolveApiBaseUrl(): string {
  const explicit =
    env('EXPO_PUBLIC_API_URL', '') || env('EXPO_PUBLIC_API_BASE_URL', '')
  if (explicit) {
    return normalizeApiBaseUrl(explicit)
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const { hostname, origin } = window.location

    // Vercel / produção: API no mesmo host.
    if (hasCollocatedApi(hostname)) {
      return `${origin}/api/v1`
    }

    // Expo web local não faz proxy de /api — backend padrão em :3001.
    if (isLocalDevHostname(hostname)) {
      return DEFAULT_DEV_API_BASE_URL
    }

    return `${origin}/api/v1`
  }

  return DEFAULT_DEV_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl()
