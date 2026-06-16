import Constants from 'expo-constants'

const PROD_LIVE_SHARE_WEB_BASE_URL = 'https://prefeitura.telefarmed.com.br'
const DEFAULT_DEV_WEB_PORT = '5173'

function readEnv(key: string): string {
  const value = process.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function resolveDevHostFromExpo(): string | null {
  const hostUri = Constants.expoConfig?.hostUri?.trim()
  if (hostUri) {
    const host = hostUri.split(':')[0]?.trim()
    if (host) return host
  }

  const linkingUri = Constants.linkingUri?.trim()
  if (linkingUri) {
    const match = linkingUri.match(/^exp(?:\+[\w-]+)?:\/\/([^:/]+)/i)
    if (match?.[1]) return match[1]
  }

  return null
}

/** Base URL do viewer web — em dev usa IP do Metro + porta do Vite (5173). */
export function resolveLiveShareWebBaseUrl(): string {
  const explicit = readEnv('EXPO_PUBLIC_LIVE_SHARE_WEB_BASE_URL')
  if (explicit) return explicit

  if (__DEV__) {
    const webPort = readEnv('EXPO_PUBLIC_LIVE_SHARE_WEB_PORT') || DEFAULT_DEV_WEB_PORT
    const devHost = resolveDevHostFromExpo()
    if (devHost) return `http://${devHost}:${webPort}`
    return `http://localhost:${webPort}`
  }

  return PROD_LIVE_SHARE_WEB_BASE_URL
}
