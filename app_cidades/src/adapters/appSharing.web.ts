import type { ShareFileOptions, ShareUrlOptions } from './appSharing.types'

export type { ShareFileOptions, ShareUrlOptions } from './appSharing.types'

const LOCAL_URI_PREFIXES = ['file://', 'content://', 'webfs://', 'telefarmed-pdf-html://']

export function isWebShareApiAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator.share === 'function'
  )
}

export async function isSharingAvailable(): Promise<boolean> {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function assertWebShareableUri(uri: string): void {
  if (LOCAL_URI_PREFIXES.some((prefix) => uri.startsWith(prefix))) {
    throw new Error(
      'Compartilhamento de arquivo local por URI nao e suportado no navegador. Use blob, data-uri ou HTTPS.',
    )
  }
}

export function dataUriToBlob(dataUri: string): Blob {
  const commaIndex = dataUri.indexOf(',')
  if (commaIndex < 0) {
    throw new Error('Data URI invalida para compartilhamento.')
  }

  const metadata = dataUri.slice(0, commaIndex)
  const payload = dataUri.slice(commaIndex + 1)
  const mimeMatch = metadata.match(/data:([^;]+)/)
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream'

  if (!metadata.includes(';base64')) {
    return new Blob([decodeURIComponent(payload)], { type: mimeType })
  }

  if (typeof globalThis.atob !== 'function') {
    throw new Error('Base64 indisponivel neste navegador.')
  }

  const binary = globalThis.atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

async function fetchBlobFromUri(uri: string): Promise<Blob> {
  assertWebShareableUri(uri)

  const response = await fetch(uri)
  if (!response.ok) {
    throw new Error('Nao foi possivel ler o arquivo para compartilhamento.')
  }

  return response.blob()
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function openBlobInNewTab(blob: Blob): boolean {
  const objectUrl = URL.createObjectURL(blob)
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  return Boolean(opened)
}

function resolveFilename(options: ShareFileOptions, blob: Blob): string {
  if (options.filename) return options.filename

  if (blob.type === 'application/pdf') return 'documento.pdf'
  if (blob.type === 'image/png') return 'imagem.png'
  if (blob.type === 'image/jpeg') return 'imagem.jpg'
  return 'arquivo'
}

export async function shareBlob(blob: Blob, options: ShareFileOptions = {}): Promise<void> {
  const filename = resolveFilename(options, blob)
  const mimeType = options.mimeType ?? (blob.type || 'application/octet-stream')
  const file = new File([blob], filename, { type: mimeType })

  if (isWebShareApiAvailable() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: options.dialogTitle ?? filename,
      })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
    }
  }

  const canPreviewInline =
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/')

  if (canPreviewInline && openBlobInNewTab(blob)) {
    return
  }

  triggerBlobDownload(blob, filename)
}

export async function downloadBlob(blob: Blob, options: ShareFileOptions = {}): Promise<void> {
  triggerBlobDownload(blob, resolveFilename(options, blob))
}

export async function shareLocalFile(uri: string, options: ShareFileOptions = {}): Promise<void> {
  const blob = await fetchBlobFromUri(uri)
  await shareBlob(blob, options)
}

export async function fetchShareableBlobFromUri(uri: string): Promise<Blob> {
  return fetchBlobFromUri(uri)
}

export async function shareUrl(url: string, options: ShareUrlOptions = {}): Promise<void> {
  if (url.startsWith('file://') || url.startsWith('webfs://')) {
    throw new Error('URLs locais nao podem ser compartilhadas no navegador.')
  }

  if (isWebShareApiAvailable()) {
    try {
      await navigator.share({
        url,
        title: options.dialogTitle,
        text: options.text,
      })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
    }
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    throw new Error('Permita pop-ups para abrir o link no navegador.')
  }
}
