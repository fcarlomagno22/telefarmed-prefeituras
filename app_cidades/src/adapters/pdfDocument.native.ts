import { isSharingAvailable, shareLocalFile } from './appSharing'
import { copyAsync, documentDirectory } from './fileSystem'
import {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  type PdfFileResult,
  type PrintHtmlToPdfOptions,
  type SavePdfOptions,
  type SharePdfOptions,
} from './pdfDocument.types'
import { renderHtmlToPdfFile } from './pdfPrint'

export { DEFAULT_PDF_PAGE_HEIGHT, DEFAULT_PDF_PAGE_WIDTH } from './pdfDocument.types'

export async function createPdfFileFromHtml(
  options: PrintHtmlToPdfOptions,
): Promise<PdfFileResult> {
  return renderHtmlToPdfFile(options)
}

export async function isPdfSharingAvailable(): Promise<boolean> {
  return isSharingAvailable()
}

export async function sharePdfFile(
  { uri }: PdfFileResult,
  options: SharePdfOptions = {},
): Promise<void> {
  await shareLocalFile(uri, {
    mimeType: options.mimeType ?? 'application/pdf',
    UTI: options.UTI ?? 'com.adobe.pdf',
    dialogTitle: options.dialogTitle,
    filename: options.filename,
  })
}

export async function savePdfFile(
  { uri }: PdfFileResult,
  { filename }: SavePdfOptions,
): Promise<string> {
  const baseDirectory = documentDirectory
  if (!baseDirectory) {
    throw new Error('Armazenamento local indisponivel neste dispositivo.')
  }

  const destination = `${baseDirectory}${filename}`
  await copyAsync({ from: uri, to: destination })
  return destination
}

export async function downloadPdfFile(
  pdf: PdfFileResult,
  options: SharePdfOptions = {},
): Promise<void> {
  await sharePdfFile(pdf, options)
}
