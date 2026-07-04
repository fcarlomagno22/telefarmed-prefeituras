import Constants from 'expo-constants'
import { appEnv } from '../config/env'
import { WEB_ROUTE_PATHS } from '../config/webRoutes'
import { isValidLiveShareToken, normalizeLiveShareToken } from './runWalkLiveShareToken'

export const LIVE_SHARE_APP_SCHEME = 'telefarmedcidades'
export const LIVE_SHARE_PROD_WEB_BASE_URL = 'https://seguranca.telefarmed.com.br'

const LIVE_SHARE_DEDICATED_HOST_PATTERN = /(?:^|\.)telefarmed\.com\.br$/i
const LIVE_SHARE_ROUTE_PREFIX = WEB_ROUTE_PATHS.liveShareViewerPrefix.replace(/^\//, '')
const DEFAULT_EXPO_WEB_PORT = '8081'

function readEnv(key: string): string {
  const value = process.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '')
}

function tryParseLiveShareToken(raw: string): string | null {
  const token = normalizeLiveShareToken(raw)
  return isValidLiveShareToken(token) ? token : null
}

function resolveDevExpoWebOrigin(): string {
  const webPort = readEnv('EXPO_PUBLIC_LIVE_SHARE_WEB_PORT') || DEFAULT_EXPO_WEB_PORT
  const hostUri = Constants.expoConfig?.hostUri?.trim()

  if (hostUri) {
    const host = hostUri.split(':')[0]?.trim()
    if (host) return `http://${host}:${webPort}`
  }

  return `http://localhost:${webPort}`
}

/** Base URL usada ao gerar links web compartilháveis. */
function resolveWebShareBaseUrl(): string {
  const explicit = readEnv('EXPO_PUBLIC_LIVE_SHARE_WEB_BASE_URL')
  if (explicit) return normalizeBaseUrl(explicit)

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (__DEV__) {
    return resolveDevExpoWebOrigin()
  }

  return normalizeBaseUrl(appEnv.liveShareWebBaseUrl || LIVE_SHARE_PROD_WEB_BASE_URL)
}

function usesDedicatedRootTokenPath(baseUrl: string): boolean {
  try {
    const { hostname } = new URL(baseUrl.includes('://') ? baseUrl : `https://${baseUrl}`)
    return LIVE_SHARE_DEDICATED_HOST_PATTERN.test(hostname)
  } catch {
    return false
  }
}

function buildLiveShareWebPath(baseUrl: string, token: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl)

  if (usesDedicatedRootTokenPath(normalizedBase)) {
    return `${normalizedBase}/${token}`
  }

  return `${normalizedBase}${WEB_ROUTE_PATHS.liveShareViewerPrefix}/${token}`
}

export function parseLiveShareTokenFromWebPath(path: string): string | null {
  const normalized = path.replace(/^\//, '')
  if (!normalized.startsWith(`${LIVE_SHARE_ROUTE_PREFIX}/`)) {
    return null
  }

  const rawToken = decodeURIComponent(
    normalized.slice(LIVE_SHARE_ROUTE_PREFIX.length + 1).split('/')[0] ?? '',
  )
  return tryParseLiveShareToken(rawToken)
}

function parseTokenFromPathname(pathname: string, options?: { allowRootToken?: boolean }): string | null {
  const fromRoute = parseLiveShareTokenFromWebPath(pathname)
  if (fromRoute) return fromRoute

  if (!options?.allowRootToken) return null

  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean)
  if (segments.length !== 1) return null

  const segment = segments[0]?.toLowerCase()
  if (!segment || segment === LIVE_SHARE_ROUTE_PREFIX || segment === 'login') {
    return null
  }

  return tryParseLiveShareToken(decodeURIComponent(segments[0]))
}

function parseTokenFromHash(hash: string): string | null {
  const normalized = hash.replace(/^#/, '').trim()
  if (!normalized) return null

  const pathPart = normalized.split('?')[0]?.replace(/^\//, '') ?? ''
  if (!pathPart) return null

  return parseLiveShareTokenFromWebPath(`/${pathPart}`)
}

export function buildLiveShareViewerAppLink(shareToken: string): string {
  const token = normalizeLiveShareToken(shareToken)
  return `${LIVE_SHARE_APP_SCHEME}://${token}`
}

export function buildLiveShareViewerWebLink(shareToken: string): string | null {
  const token = normalizeLiveShareToken(shareToken)

  if (!__DEV__) {
    return buildLiveShareWebPath(LIVE_SHARE_PROD_WEB_BASE_URL, token)
  }

  return buildLiveShareWebPath(resolveWebShareBaseUrl(), token)
}

export function buildLiveShareViewerLink(shareToken: string): string {
  const webLink = buildLiveShareViewerWebLink(shareToken)
  if (webLink) return webLink
  return buildLiveShareViewerAppLink(shareToken)
}

export function parseLiveShareViewerLink(url: string): string | null {
  if (!url.trim()) return null

  const decoded = decodeURIComponent(url.trim())

  const schemeMatch = decoded.match(
    new RegExp(`^${LIVE_SHARE_APP_SCHEME}://([A-Z0-9]{6,12})`, 'i'),
  )
  if (schemeMatch?.[1]) {
    return tryParseLiveShareToken(schemeMatch[1])
  }

  try {
    const parsed = new URL(decoded.includes('://') ? decoded : `https://${decoded}`)

    const fromPath = parseTokenFromPathname(parsed.pathname)
    if (fromPath) return fromPath

    const fromHash = parseTokenFromHash(parsed.hash)
    if (fromHash) return fromHash

    if (LIVE_SHARE_DEDICATED_HOST_PATTERN.test(parsed.hostname)) {
      return parseTokenFromPathname(parsed.pathname, { allowRootToken: true })
    }
  } catch {
    // URL inválida — tenta fallback legado abaixo.
  }

  const legacyMatch = decoded.match(/acompanhar[/:]([A-Z0-9]{6,12})/i)
  if (legacyMatch?.[1]) {
    return tryParseLiveShareToken(legacyMatch[1])
  }

  return null
}
