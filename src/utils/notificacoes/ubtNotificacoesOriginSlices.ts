import type {
  PrefeituraNotification,
  PrefeituraNotificacoesOriginSlice,
} from '../../data/prefeituraNotificacoesMock'
import { isPrefeituraNotificationUnread } from '../../components/prefeitura/notificacoes/prefeituraNotificacoesUi'

export function computeUbtNotificacoesOriginSlices(
  notifications: PrefeituraNotification[],
): PrefeituraNotificacoesOriginSlice[] {
  const telefarmed = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'telefarmed',
  )
  const gestao = notifications.filter(
    (n) => n.direction === 'inbox' && n.origin === 'contract_manager',
  )
  const sent = notifications.filter((n) => n.direction === 'sent' && n.origin === 'ubt')

  return [
    {
      key: 'telefarmed',
      label: 'Telefarmed',
      count: telefarmed.length,
      unread: telefarmed.filter(isPrefeituraNotificationUnread).length,
    },
    {
      key: 'contract_manager',
      label: 'Gestão municipal',
      count: gestao.length,
      unread: gestao.filter(isPrefeituraNotificationUnread).length,
    },
    {
      key: 'ubt',
      label: 'Enviadas por você',
      count: sent.length,
      unread: 0,
    },
  ]
}
