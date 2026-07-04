import { downloadPdfFile } from '../adapters/pdfDocument'
import { GlucoseReportSummary } from '../types/glucose'
import {
  buildGlucoseReportFilename,
  createGlucoseReportPdf,
  type GlucosePdfMeta,
} from './glucoseReportPdfShared'

export async function shareGlucoseReportPdf(
  report: GlucoseReportSummary,
  meta: GlucosePdfMeta = {},
) {
  const pdf = await createGlucoseReportPdf(report, meta)
  const filename = buildGlucoseReportFilename()

  await downloadPdfFile(pdf, {
    dialogTitle: 'Compartilhar relatório de glicemia',
    filename,
  })
}

export async function saveGlucoseReportPdf(
  report: GlucoseReportSummary,
  meta: GlucosePdfMeta = {},
) {
  const pdf = await createGlucoseReportPdf(report, meta)
  const filename = buildGlucoseReportFilename()

  await downloadPdfFile(pdf, {
    dialogTitle: 'Salvar relatório de glicemia',
    filename,
  })

  return filename
}
