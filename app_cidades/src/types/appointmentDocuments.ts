export type ConsultationDocumentKind = 'prescription' | 'exam' | 'certificate'

export type PrescriptionMedication = {
  name: string
  dosage: string
  instructions: string
}

export type ConsultationPrescriptionPayload = {
  medications: PrescriptionMedication[]
  validUntil?: string
  notes?: string
}

export type ConsultationExamPayload = {
  exams: Array<{
    name: string
    category: string
    instructions?: string
  }>
}

export type ConsultationCertificatePayload = {
  daysOff: number
  reason: string
  cid?: string
  startDate?: string
}

export type ConsultationDocumentPdf = {
  id: string
  kind: ConsultationDocumentKind
  title: string
  fileName: string
  signedAt: string
  downloadLabel: string
  payload:
    | ConsultationPrescriptionPayload
    | ConsultationExamPayload
    | ConsultationCertificatePayload
}

export type ConsultationDocumentsBundle = {
  appointmentId: string
  documents: ConsultationDocumentPdf[]
}
