import { isPdfSharingAvailable, savePdfFile, sharePdfFile } from '../adapters/pdfDocument'
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
  if (!(await isPdfSharingAvailable())) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  const filename = buildBodyCompositionReportFilename()
  await sharePdfFile(pdf, {
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
  const destination = await savePdfFile(pdf, { filename })

  if (await isPdfSharingAvailable()) {
    await sharePdfFile(
      { uri: destination },
      {
        dialogTitle: 'Salvar relatorio de composicao corporal',
        filename,
      },
    )
  }

  return destination
}
