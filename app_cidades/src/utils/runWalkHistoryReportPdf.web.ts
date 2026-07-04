import { downloadPdfFile } from '../adapters/pdfDocument'
import {
  buildRunWalkHistoryReportFilename,
  createRunWalkHistoryReportPdf,
  type RunWalkHistoryReportPayload,
} from './runWalkHistoryReportPdfShared'

export async function shareRunWalkHistoryReportPdf(payload: RunWalkHistoryReportPayload) {
  const pdf = await createRunWalkHistoryReportPdf(payload)

  await downloadPdfFile(pdf, {
    dialogTitle: 'Compartilhar relatório de corrida e caminhada',
    filename: buildRunWalkHistoryReportFilename(),
  })
}
