/**
 * Mobile: expo-print converte HTML em arquivo PDF local (printToFileAsync).
 * Web usa pdfPrint.web.ts — html2pdf.js ou impressao do HTML isolado (iframe),
 * nunca a pagina atual do app nem expo-print.
 */
import * as Print from 'expo-print'
import {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  type RenderHtmlToPdfOptions,
  type RenderHtmlToPdfResult,
} from './pdfPrint.types'

export {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  HTML_PRINT_FALLBACK_URI_PREFIX,
  isHtmlPrintFallbackPdf,
} from './pdfPrint.types'

export async function renderHtmlToPdfFile({
  html,
  width = DEFAULT_PDF_PAGE_WIDTH,
  height = DEFAULT_PDF_PAGE_HEIGHT,
  base64 = false,
}: RenderHtmlToPdfOptions): Promise<RenderHtmlToPdfResult> {
  const result = await Print.printToFileAsync({ html, base64, width, height })
  return { uri: result.uri }
}

export async function printHtmlDocument(_html: string, _title?: string): Promise<void> {
  throw new Error('printHtmlDocument nao e suportado no mobile. Use renderHtmlToPdfFile.')
}
