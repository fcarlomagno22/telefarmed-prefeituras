import type {
  PrefeituraNotification,
  PrefeituraNotificacoesOriginSlice,
} from '../../data/prefeituraNotificacoesMock'
import { isPrefeituraNotificationUnread } from '../../components/prefeitura/notificacoes/prefeituraNotificacoesUi'

export function computePrefeituraNotificacoesOriginSlices(
  notifications: PrefeituraNotification[],
): PrefeituraNotificacoesOriginSlice[] {
  const telefarmed = notifications.filter(
    (item) => item.direction === 'inbox' && item.origin === 'telefarmed',
  )
  const ubt = notifications.filter((item) => item.direction === 'inbox' && item.origin === 'ubt')
  const sent = notifications.filter(
    (item) => item.direction === 'sent' && item.origin === 'contract_manager',
  )

  return [
    {
      key: 'telefarmed',
      label: 'Telefarmed',
      count: telefarmed.length,
      unread: telefarmed.filter(isPrefeituraNotificationUnread).length,
    },
    {
      key: 'ubt',
      label: 'Unidades (UBT)',
      count: ubt.length,
      unread: ubt.filter(isPrefeituraNotificationUnread).length,
    },
    {
      key: 'contract_manager',
      label: 'Enviadas por você',
      count: sent.length,
      unread: 0,
    },
  ]
}
