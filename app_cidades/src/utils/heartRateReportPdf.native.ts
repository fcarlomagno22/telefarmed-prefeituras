import { isPdfSharingAvailable, sharePdfFile } from '../adapters/pdfDocument'
import { HeartRateReportSummary } from '../types/heartRate'
import {
  buildHeartRateReportFilename,
  createHeartRateReportPdf,
  type HeartRatePdfMeta,
} from './heartRateReportPdfShared'

export async function shareHeartRateReportPdf(
  report: HeartRateReportSummary,
  meta: HeartRatePdfMeta = {},
) {
  const pdf = await createHeartRateReportPdf(report, meta)
  if (!(await isPdfSharingAvailable())) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await sharePdfFile(pdf, {
    dialogTitle: 'Compartilhar relatorio de frequencia cardiaca',
    filename: buildHeartRateReportFilename(),
  })
}
