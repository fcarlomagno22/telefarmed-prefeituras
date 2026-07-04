import { isPdfSharingAvailable, savePdfFile, sharePdfFile } from '../adapters/pdfDocument'
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
  if (!(await isPdfSharingAvailable())) {
    throw new Error('Compartilhamento indisponível neste dispositivo.')
  }

  const filename = buildBloodPressureReportFilename()
  await sharePdfFile(pdf, {
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
  const destination = await savePdfFile(pdf, { filename })

  if (await isPdfSharingAvailable()) {
    await sharePdfFile(
      { uri: destination },
      {
        dialogTitle: 'Salvar relatório de pressão arterial',
        filename,
      },
    )
  }

  return destination
}
