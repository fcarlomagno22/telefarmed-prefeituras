import { isPdfSharingAvailable, sharePdfFile } from '../adapters/pdfDocument'
import {
  buildRunWalkHistoryReportFilename,
  createRunWalkHistoryReportPdf,
  type RunWalkHistoryReportPayload,
} from './runWalkHistoryReportPdfShared'

export async function shareRunWalkHistoryReportPdf(payload: RunWalkHistoryReportPayload) {
  const pdf = await createRunWalkHistoryReportPdf(payload)
  if (!(await isPdfSharingAvailable())) {
    throw new Error('Compartilhamento indisponível neste dispositivo.')
  }

  await sharePdfFile(pdf, {
    dialogTitle: 'Compartilhar relatório de corrida e caminhada',
    filename: buildRunWalkHistoryReportFilename(),
  })
}
