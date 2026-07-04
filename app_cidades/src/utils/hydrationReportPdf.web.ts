import { downloadPdfFile } from '../adapters/pdfDocument'
import { HydrationReportSummary } from '../types/hydration'
import {
  buildHydrationReportFilename,
  createHydrationReportPdf,
  type HydrationPdfMeta,
} from './hydrationReportPdfShared'

export async function shareHydrationReportPdf(
  report: HydrationReportSummary,
  meta: HydrationPdfMeta = {},
) {
  const pdf = await createHydrationReportPdf(report, meta)

  await downloadPdfFile(pdf, {
    dialogTitle: 'Compartilhar relatorio de hidratacao',
    filename: buildHydrationReportFilename(),
  })
}
