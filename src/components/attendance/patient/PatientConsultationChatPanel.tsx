import { ConsultationChatPanel } from '../ConsultationChatPanel'
import { usePublicMensagens } from '../../../hooks/usePublicAtendimentoSession'

type PatientConsultationChatPanelProps = {
  className?: string
  token?: string
}

export function PatientConsultationChatPanel({ className, token }: PatientConsultationChatPanelProps) {
  const { messages, loading, sendMessage, sendAttachmentFile } = usePublicMensagens(token)

  return (
    <ConsultationChatPanel
      viewerRole="patient"
      className={className}
      messages={token ? messages : undefined}
      loading={Boolean(token) && loading}
      onSendMessage={token ? sendMessage : undefined}
      onSendAttachmentFile={token ? sendAttachmentFile : undefined}
    />
  )
}
