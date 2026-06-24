export type PacienteNotificationPriority = 'normal' | 'important'

export type PacienteNotification = {
  id: string
  title: string
  body: string
  priority: PacienteNotificationPriority
  senderLabel: string
  sentAt: string
  readAt: string | null
}
