export {
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  type PrintHtmlToPdfOptions as RenderHtmlToPdfOptions,
} from './pdfDocument.types'

export const HTML_PRINT_FALLBACK_URI_PREFIX = 'telefarmed-pdf-html://'

export type RenderHtmlToPdfResult = {
  uri: string
}

export function isHtmlPrintFallbackPdf(uri: string): boolean {
  return uri.startsWith(HTML_PRINT_FALLBACK_URI_PREFIX)
}
