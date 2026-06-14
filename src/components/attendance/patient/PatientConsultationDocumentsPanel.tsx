import { ConsultationDocumentsPanel } from '../ConsultationDocumentsPanel'
import { usePublicDocumentos } from '../../../hooks/usePublicDocumentos'
import { patientConsultationCardClass } from './patientConsultationUi'

type PatientConsultationDocumentsPanelProps = {
  token?: string
  className?: string
}

export function PatientConsultationDocumentsPanel({
  token,
  className,
}: PatientConsultationDocumentsPanelProps) {
  const { documents, downloadDocument } = usePublicDocumentos(token)

  return (
    <ConsultationDocumentsPanel
      cardClassName={patientConsultationCardClass}
      className={className}
      documents={token ? documents : []}
      onDownloadDocument={(doc) => void downloadDocument(doc)}
    />
  )
}
