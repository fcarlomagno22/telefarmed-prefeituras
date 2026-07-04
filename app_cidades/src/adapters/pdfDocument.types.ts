export const DEFAULT_PDF_PAGE_WIDTH = 595
export const DEFAULT_PDF_PAGE_HEIGHT = 842

export type PrintHtmlToPdfOptions = {
  html: string
  width?: number
  height?: number
  base64?: boolean
}

export type PdfFileResult = {
  uri: string
}

export type SharePdfOptions = {
  mimeType?: string
  dialogTitle?: string
  UTI?: string
  filename?: string
}

export type SavePdfOptions = {
  filename: string
}
