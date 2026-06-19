import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type PDFDocument from 'pdfkit'

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'assets/fonts')

export const PDF_FONT = {
  regular: 'Poppins',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
} as const

export function registerClinicalDocumentFonts(doc: InstanceType<typeof PDFDocument>): void {
  doc.registerFont(PDF_FONT.regular, join(ASSETS_DIR, 'Poppins-Regular.ttf'))
  doc.registerFont(PDF_FONT.medium, join(ASSETS_DIR, 'Poppins-Medium.ttf'))
  doc.registerFont(PDF_FONT.semiBold, join(ASSETS_DIR, 'Poppins-SemiBold.ttf'))
}
