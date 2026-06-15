import { getMockConsultationDocuments } from '../data/mockAppointmentDocuments'
import { CONSULTATION_DOCUMENT_PALETTES } from '../theme/consultationDocumentColors'
import {
  ConsultationDocumentKind,
  ConsultationDocumentsBundle,
} from '../types/appointmentDocuments'
import { StoredAppointment } from '../types/myAppointments'

export function fetchConsultationDocuments(
  appointment: StoredAppointment,
): ConsultationDocumentsBundle {
  return getMockConsultationDocuments(appointment.id, appointment.protocol)
}

export function getConsultationDocumentPalette(kind: ConsultationDocumentKind) {
  return CONSULTATION_DOCUMENT_PALETTES[kind]
}
