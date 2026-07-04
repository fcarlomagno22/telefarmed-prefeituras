import type { ImageSourcePropType } from 'react-native'
import { appEnv } from '../config/env'
import { resolveBrandImage } from './resolveBrandImage'

export const bundledLogo = require('../../assets/logo.png') as ImageSourcePropType

let cachedDataUri: string | null = null

export function getCachedPdfLogoDataUri() {
  return cachedDataUri
}

export function setCachedPdfLogoDataUri(dataUri: string) {
  cachedDataUri = dataUri
}

export function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export function toBase64FromArrayBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary)
  }

  throw new Error('Não foi possível codificar a logomarca para o PDF.')
}

function guessMimeType(uri: string, fallback = 'image/png') {
  const lower = uri.toLowerCase()
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg'
  if (lower.includes('.webp')) return 'image/webp'
  if (lower.includes('.svg')) return 'image/svg+xml'
  return fallback
}

function normalizeFetchableUri(uri: string) {
  if (uri.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${uri}`
    }
  }

  return uri
}

export async function fetchUriAsDataUri(uri: string): Promise<string> {
  const trimmed = uri.trim()
  if (!trimmed) {
    throw new Error('Logomarca indisponível.')
  }

  if (trimmed.startsWith('data:')) {
    return trimmed
  }

  if (trimmed.startsWith('file:')) {
    throw new Error('file:// URIs are not supported for PDF logos in this environment.')
  }

  const response = await fetch(normalizeFetchableUri(trimmed))
  if (!response.ok) {
    throw new Error('Não foi possível carregar a logomarca.')
  }

  const buffer = await response.arrayBuffer()
  const mime =
    response.headers.get('content-type')?.split(';')[0]?.trim() ?? guessMimeType(trimmed)

  return `data:${mime};base64,${toBase64FromArrayBuffer(buffer)}`
}

export async function resolveConfiguredPdfLogoDataUri(
  readUriAsDataUri: (uri: string) => Promise<string>,
  resolveModuleAssetDataUri: (moduleId: number) => Promise<string>,
): Promise<string> {
  const cached = getCachedPdfLogoDataUri()
  if (cached) {
    return cached
  }

  const configured = appEnv.logoUrl.trim()
  if (isRemoteUrl(configured)) {
    const dataUri = await readUriAsDataUri(configured)
    setCachedPdfLogoDataUri(dataUri)
    return dataUri
  }

  const source = resolveBrandImage(configured, 'logo.png')
  if (typeof source === 'number') {
    const dataUri = await resolveModuleAssetDataUri(source)
    setCachedPdfLogoDataUri(dataUri)
    return dataUri
  }

  if (typeof source === 'object' && source !== null && 'uri' in source && typeof source.uri === 'string') {
    const dataUri = await readUriAsDataUri(source.uri)
    setCachedPdfLogoDataUri(dataUri)
    return dataUri
  }

  const dataUri = await resolveModuleAssetDataUri(bundledLogo as number)
  setCachedPdfLogoDataUri(dataUri)
  return dataUri
}
