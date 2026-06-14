import { ConsultationChatPanel } from '../ConsultationChatPanel'
import type { ConsultationChatMessage } from '../consultationChatTypes'

type DoctorConsultationChatPanelProps = {
  className?: string
  cardClassName?: string
  messages: ConsultationChatMessage[]
  loading?: boolean
  readOnly?: boolean
  onSendMessage?: (text: string) => Promise<void>
  onSendAttachmentFile?: (file: File, type: 'image' | 'pdf') => Promise<void>
}

export function DoctorConsultationChatPanel({
  className,
  cardClassName,
  messages,
  loading = false,
  readOnly = false,
  onSendMessage,
  onSendAttachmentFile,
}: DoctorConsultationChatPanelProps) {
  return (
    <ConsultationChatPanel
      viewerRole="doctor"
      className={className}
      cardClassName={cardClassName}
      messages={messages}
      loading={loading}
      readOnly={readOnly}
      onSendMessage={onSendMessage}
      onSendAttachmentFile={onSendAttachmentFile}
    />
  )
}
