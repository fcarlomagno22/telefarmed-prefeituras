import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/ubt/notificacoes'
import * as mock from '../../mockServices/ubt/notificacoes'

const useApi = isBackendApiEnabled()

export type {
  CreateUbtBroadcastPayload,
  UbtNotificationKpisResponse,
  UbtNotificationListResponse,
  UbtProfissionalRecipient,
} from '../../mockServices/ubt/notificacoes'

export const UbtNotificacoesApiError = useApi ? api.UbtNotificacoesApiError : mock.UbtNotificacoesApiError

export const isUbtNotificacoesApiError = useApi
  ? api.isUbtNotificacoesApiError
  : mock.isUbtNotificacoesApiError

export const fetchUbtNotificationKpis = useApi
  ? api.fetchUbtNotificationKpis
  : mock.fetchUbtNotificationKpis

export const fetchUbtNotifications = useApi ? api.fetchUbtNotifications : mock.fetchUbtNotifications

export const fetchUbtProfissionaisCatalog = useApi
  ? api.fetchUbtProfissionaisCatalog
  : mock.fetchUbtProfissionaisCatalog

export const createUbtBroadcast = useApi ? api.createUbtBroadcast : mock.createUbtBroadcast

export const markUbtNotificationRead = useApi ? api.markUbtNotificationRead : mock.markUbtNotificationRead

export const markAllUbtNotificationsRead = useApi
  ? api.markAllUbtNotificationsRead
  : mock.markAllUbtNotificationsRead
