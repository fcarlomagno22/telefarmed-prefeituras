export type ConsultationChatAttachment = {
  id: string
  type: 'image' | 'pdf'
  url: string
  name: string
  size?: number
}

export type ConsultationChatMessage = {
  id: string
  from: 'doctor' | 'patient'
  time: string
  text?: string
  attachments?: ConsultationChatAttachment[]
}

export type ConsultationChatViewerRole = ConsultationChatMessage['from']

export function formatConsultationAttachmentSize(bytes?: number) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
