import { ConsultationDocumentsPanel } from '../ConsultationDocumentsPanel'
import type { ConsultationDocumentItem } from '../ConsultationDocumentsPanel'
import { patientConsultationCardClass } from './patientConsultationUi'

type PatientConsultationDocumentsPanelProps = {
  documents?: ConsultationDocumentItem[]
  className?: string
}

export function PatientConsultationDocumentsPanel({
  documents = [],
  className,
}: PatientConsultationDocumentsPanelProps) {
  return (
    <ConsultationDocumentsPanel
      cardClassName={patientConsultationCardClass}
      className={className}
      documents={documents}
    />
  )
}
