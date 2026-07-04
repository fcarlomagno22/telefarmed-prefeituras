import { downloadPdfFile } from '../adapters/pdfDocument'
import { BodyCompositionReportSummary } from '../types/bodyComposition'
import {
  buildBodyCompositionReportFilename,
  createBodyCompositionReportPdf,
  type BodyCompositionPdfMeta,
} from './bodyCompositionReportPdfShared'

export async function shareBodyCompositionReportPdf(
  report: BodyCompositionReportSummary,
  meta: BodyCompositionPdfMeta = {},
) {
  const pdf = await createBodyCompositionReportPdf(report, meta)
  const filename = buildBodyCompositionReportFilename()

  await downloadPdfFile(pdf, {
    dialogTitle: 'Compartilhar relatorio de composicao corporal',
    filename,
  })
}

export async function saveBodyCompositionReportPdf(
  report: BodyCompositionReportSummary,
  meta: BodyCompositionPdfMeta = {},
) {
  const pdf = await createBodyCompositionReportPdf(report, meta)
  const filename = buildBodyCompositionReportFilename()

  await downloadPdfFile(pdf, {
    dialogTitle: 'Salvar relatorio de composicao corporal',
    filename,
  })

  return filename
}
