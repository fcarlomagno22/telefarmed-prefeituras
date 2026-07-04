import { isPdfSharingAvailable, savePdfFile, sharePdfFile } from '../adapters/pdfDocument'
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
  if (!(await isPdfSharingAvailable())) {
    throw new Error('Compartilhamento indisponível neste dispositivo.')
  }

  await sharePdfFile(pdf, {
    dialogTitle: 'Compartilhar relatório de glicemia',
    filename: buildGlucoseReportFilename(),
  })
}

export async function saveGlucoseReportPdf(
  report: GlucoseReportSummary,
  meta: GlucosePdfMeta = {},
) {
  const pdf = await createGlucoseReportPdf(report, meta)
  const filename = buildGlucoseReportFilename()
  const destination = await savePdfFile(pdf, { filename })

  if (await isPdfSharingAvailable()) {
    await sharePdfFile(
      { uri: destination },
      {
        dialogTitle: 'Salvar relatório de glicemia',
        filename,
      },
    )
  }

  return destination
}
