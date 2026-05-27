import { ConsultationChatPanel } from '../ConsultationChatPanel'

type PatientConsultationChatPanelProps = {
  className?: string
}

export function PatientConsultationChatPanel({ className }: PatientConsultationChatPanelProps) {
  return <ConsultationChatPanel viewerRole="patient" className={className} />
}
