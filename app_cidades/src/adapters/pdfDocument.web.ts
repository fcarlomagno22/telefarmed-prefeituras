import {
  downloadBlob,
  fetchShareableBlobFromUri,
  isSharingAvailable,
  shareLocalFile,
} from './appSharing'
import { copyAsync, documentDirectory } from './fileSystem'
import {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  type PdfFileResult,
  type PrintHtmlToPdfOptions,
  type SavePdfOptions,
  type SharePdfOptions,
} from './pdfDocument.types'
import {
  deliverHtmlPrintFallback,
  isHtmlPrintFallbackPdf,
  releaseHtmlPrintFallback,
  renderHtmlToPdfFile,
} from './pdfPrint'

export { DEFAULT_PDF_PAGE_HEIGHT, DEFAULT_PDF_PAGE_WIDTH } from './pdfDocument.types'

const blobRevokers = new Map<string, () => void>()

function registerRevoker(uri: string, revoke: () => void) {
  blobRevokers.get(uri)?.()
  blobRevokers.set(uri, revoke)
}

function releasePdfResource(uri: string) {
  if (isHtmlPrintFallbackPdf(uri)) {
    releaseHtmlPrintFallback(uri)
    return
  }

  const revoke = blobRevokers.get(uri)
  if (revoke) {
    revoke()
    blobRevokers.delete(uri)
  }
}

async function fetchPdfBlob(uri: string): Promise<Blob> {
  if (isHtmlPrintFallbackPdf(uri)) {
    throw new Error('Documento HTML pendente de conversao para PDF.')
  }

  return fetchShareableBlobFromUri(uri)
}

export async function createPdfFileFromHtml({
  html,
  width = DEFAULT_PDF_PAGE_WIDTH,
  height = DEFAULT_PDF_PAGE_HEIGHT,
}: PrintHtmlToPdfOptions): Promise<PdfFileResult> {
  const result = await renderHtmlToPdfFile({ html, width, height })

  if (!isHtmlPrintFallbackPdf(result.uri)) {
    registerRevoker(result.uri, () => URL.revokeObjectURL(result.uri))
  }

  return result
}

export async function isPdfSharingAvailable(): Promise<boolean> {
  return isSharingAvailable()
}

export async function sharePdfFile(
  { uri }: PdfFileResult,
  options: SharePdfOptions = {},
): Promise<void> {
  if (isHtmlPrintFallbackPdf(uri)) {
    await deliverHtmlPrintFallback(uri, options.dialogTitle)
    return
  }

  await shareLocalFile(uri, {
    mimeType: options.mimeType ?? 'application/pdf',
    dialogTitle: options.dialogTitle,
    filename: options.filename ?? 'documento.pdf',
  })
}

export async function savePdfFile(
  { uri }: PdfFileResult,
  { filename }: SavePdfOptions,
): Promise<string> {
  if (isHtmlPrintFallbackPdf(uri)) {
    await deliverHtmlPrintFallback(uri, filename)
    return uri
  }

  const baseDirectory = documentDirectory
  if (!baseDirectory) {
    throw new Error('Armazenamento local indisponivel neste navegador.')
  }

  const destination = `${baseDirectory}${filename}`
  await copyAsync({ from: uri, to: destination })
  releasePdfResource(uri)

  return destination
}

export async function downloadPdfFile(
  { uri }: PdfFileResult,
  options: SharePdfOptions = {},
): Promise<void> {
  const filename = options.filename ?? 'documento.pdf'

  if (isHtmlPrintFallbackPdf(uri)) {
    await deliverHtmlPrintFallback(uri, options.dialogTitle ?? filename)
    releasePdfResource(uri)
    return
  }

  const blob = await fetchPdfBlob(uri)
  await downloadBlob(blob, {
    mimeType: 'application/pdf',
    dialogTitle: options.dialogTitle,
    filename,
  })
  releasePdfResource(uri)
}
