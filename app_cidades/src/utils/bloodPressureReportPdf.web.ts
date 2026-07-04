import { downloadPdfFile } from '../adapters/pdfDocument'
import { BloodPressureReportSummary } from '../types/bloodPressure'
import {
  buildBloodPressureReportFilename,
  createBloodPressureReportPdf,
  type BloodPressurePdfMeta,
} from './bloodPressureReportPdfShared'

export async function shareBloodPressureReportPdf(
  report: BloodPressureReportSummary,
  meta: BloodPressurePdfMeta = {},
) {
  const pdf = await createBloodPressureReportPdf(report, meta)
  const filename = buildBloodPressureReportFilename()

  await downloadPdfFile(pdf, {
    dialogTitle: 'Compartilhar relatório de pressão arterial',
    filename,
  })
}

export async function saveBloodPressureReportPdf(
  report: BloodPressureReportSummary,
  meta: BloodPressurePdfMeta = {},
) {
  const pdf = await createBloodPressureReportPdf(report, meta)
  const filename = buildBloodPressureReportFilename()

  await downloadPdfFile(pdf, {
    dialogTitle: 'Salvar relatório de pressão arterial',
    filename,
  })

  return filename
}
