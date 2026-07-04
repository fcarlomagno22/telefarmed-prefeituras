import { isPdfSharingAvailable, sharePdfFile } from '../adapters/pdfDocument'
import { BodyMeasurementsReportSummary } from '../types/bodyMeasurementsReport'
import {
  buildBodyMeasurementsReportFilename,
  createBodyMeasurementsReportPdf,
  type BodyMeasurementsPdfMeta,
} from './bodyMeasurementsReportPdfShared'

export async function shareBodyMeasurementsReportPdf(
  report: BodyMeasurementsReportSummary,
  meta: BodyMeasurementsPdfMeta = {},
) {
  const pdf = await createBodyMeasurementsReportPdf(report, meta)
  if (!(await isPdfSharingAvailable())) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await sharePdfFile(pdf, {
    dialogTitle: 'Compartilhar relatorio de medidas corporais',
    filename: buildBodyMeasurementsReportFilename(),
  })
}
