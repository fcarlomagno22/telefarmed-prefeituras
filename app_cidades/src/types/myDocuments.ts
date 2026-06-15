import type { ConsultationDocumentKind, ConsultationDocumentPdf } from './appointmentDocuments'
import type { StoredAppointment } from './myAppointments'

export type MyDocumentsTab = 'by-consultation' | 'by-document'

export type DocumentKindFilter = 'all' | ConsultationDocumentKind

export type DocumentKindCounts = {
  prescription: number
  exam: number
  certificate: number
  total: number
}

export type ConsultationDocumentsEntry = {
  appointment: StoredAppointment
  documents: ConsultationDocumentPdf[]
  counts: DocumentKindCounts
}

export type FlatDocumentEntry = {
  document: ConsultationDocumentPdf
  appointment: StoredAppointment
}

export type PatientProviderFilter = {
  doctorId: string
  doctorName: string
  specialtyName: string
}

export type PatientProviderOption = PatientProviderFilter & {
  avatarUrl?: string
  consultationCount: number
  documentCount: number
}
