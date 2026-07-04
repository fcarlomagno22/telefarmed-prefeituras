import { downloadPdfFile } from '../adapters/pdfDocument'
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

  await downloadPdfFile(pdf, {
    dialogTitle: 'Compartilhar relatorio de medidas corporais',
    filename: buildBodyMeasurementsReportFilename(),
  })
}
