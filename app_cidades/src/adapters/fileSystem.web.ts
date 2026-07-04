import type {
  CopyOptions,
  DeleteOptions,
  FileInfo,
  MakeDirectoryOptions,
  ReadAsStringOptions,
} from './fileSystem.types'
import { EncodingType } from './fileSystem.types'

export { EncodingType } from './fileSystem.types'

export const documentDirectory = 'webfs://documents/'
export const cacheDirectory = 'webfs://cache/'

const fileBytes = new Map<string, Uint8Array>()
const publicUris = new Map<string, string>()

function isManagedUri(uri: string): boolean {
  return uri.startsWith('webfs://')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  if (typeof globalThis.btoa !== 'function') {
    throw new Error('Base64 encoding is unavailable in this browser.')
  }

  return globalThis.btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof globalThis.atob !== 'function') {
    throw new Error('Base64 decoding is unavailable in this browser.')
  }

  const binary = globalThis.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'application/octet-stream'
}

function registerPublicUri(storageUri: string, bytes: Uint8Array) {
  const existing = publicUris.get(storageUri)
  if (existing?.startsWith('blob:')) {
    URL.revokeObjectURL(existing)
  }

  const blob = new Blob([bytes], { type: guessMimeType(storageUri) })
  publicUris.set(storageUri, URL.createObjectURL(blob))
}

async function readBytesFromUri(uri: string): Promise<Uint8Array> {
  if (isManagedUri(uri)) {
    const bytes = fileBytes.get(uri)
    if (!bytes) {
      throw new Error(`File not found: ${uri}`)
    }
    return bytes
  }

  if (uri.startsWith('data:')) {
    const commaIndex = uri.indexOf(',')
    if (commaIndex < 0) {
      throw new Error(`Invalid data URI: ${uri}`)
    }

    const metadata = uri.slice(0, commaIndex)
    const payload = uri.slice(commaIndex + 1)

    if (metadata.includes(';base64')) {
      return base64ToBytes(payload)
    }

    return new TextEncoder().encode(decodeURIComponent(payload))
  }

  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error(`Failed to read file: ${uri}`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

export function getPublicFileUri(uri: string): string {
  if (!isManagedUri(uri)) {
    return uri
  }

  return publicUris.get(uri) ?? uri
}

export async function getInfoAsync(uri: string): Promise<FileInfo> {
  if (isManagedUri(uri)) {
    const bytes = fileBytes.get(uri)
    return {
      exists: Boolean(bytes),
      uri,
      size: bytes?.length,
      isDirectory: false,
    }
  }

  if (uri.startsWith('data:') || uri.startsWith('blob:')) {
    return { exists: true, uri }
  }

  if (/^https?:\/\//i.test(uri)) {
    try {
      const response = await fetch(uri, { method: 'HEAD' })
      return { exists: response.ok, uri }
    } catch {
      return { exists: false, uri }
    }
  }

  return { exists: false, uri }
}

export async function readAsStringAsync(
  uri: string,
  options: ReadAsStringOptions = {},
): Promise<string> {
  const bytes = await readBytesFromUri(uri)

  if (options.encoding === EncodingType.Base64) {
    return bytesToBase64(bytes)
  }

  return new TextDecoder().decode(bytes)
}

export async function copyAsync({ from, to }: CopyOptions): Promise<void> {
  const bytes = await readBytesFromUri(from)
  fileBytes.set(to, bytes)

  if (isManagedUri(to)) {
    registerPublicUri(to, bytes)
  }
}

export async function makeDirectoryAsync(
  _uri: string,
  _options: MakeDirectoryOptions = {},
): Promise<void> {}

export async function deleteAsync(uri: string, options: DeleteOptions = {}): Promise<void> {
  if (!isManagedUri(uri)) {
    if (options.idempotent) return
    throw new Error(`Cannot delete external URI on web: ${uri}`)
  }

  if (!fileBytes.has(uri)) {
    if (options.idempotent) return
    throw new Error(`File not found: ${uri}`)
  }

  fileBytes.delete(uri)

  const publicUri = publicUris.get(uri)
  if (publicUri?.startsWith('blob:')) {
    URL.revokeObjectURL(publicUri)
  }
  publicUris.delete(uri)
}
