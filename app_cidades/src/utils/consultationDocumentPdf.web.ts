import {
  createPdfFileFromHtml,
  DEFAULT_PDF_PAGE_HEIGHT,
  DEFAULT_PDF_PAGE_WIDTH,
  downloadPdfFile,
} from '../adapters/pdfDocument'
import { ConsultationDocumentPdf } from '../types/appointmentDocuments'
import { StoredAppointment } from '../types/myAppointments'
import {
  buildConsultationDocumentFilename,
  type ConsultationPdfMeta,
  resolveConsultationDocumentHtml,
} from './consultationDocumentPdfShared'

export async function downloadConsultationDocumentPdf(
  document: ConsultationDocumentPdf,
  appointment: StoredAppointment,
  meta: ConsultationPdfMeta = {},
) {
  const html = await resolveConsultationDocumentHtml(document, appointment, meta)
  const filename = buildConsultationDocumentFilename(document)
  const pdf = await createPdfFileFromHtml({
    html,
    width: DEFAULT_PDF_PAGE_WIDTH,
    height: DEFAULT_PDF_PAGE_HEIGHT,
  })

  await downloadPdfFile(pdf, {
    dialogTitle: document.downloadLabel,
    filename,
  })
}
