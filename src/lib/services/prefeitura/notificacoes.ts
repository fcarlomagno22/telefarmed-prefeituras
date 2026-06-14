import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/prefeitura/notificacoes'
import * as mock from '../../mockServices/prefeitura/notificacoes'

const useApi = isBackendApiEnabled()

export type {
  CreatePrefeituraBroadcastPayload,
  PortalNotificationKpisResponse,
  PortalNotificationListResponse,
  PrefeituraBroadcastUbtCatalog,
  PrefeituraProfissionalRecipient,
} from '../../mockServices/prefeitura/notificacoes'

export const PrefeituraNotificacoesApiError = useApi
  ? api.PrefeituraNotificacoesApiError
  : mock.PrefeituraNotificacoesApiError

export const isPrefeituraNotificacoesApiError = useApi
  ? api.isPrefeituraNotificacoesApiError
  : mock.isPrefeituraNotificacoesApiError

export const fetchPrefeituraNotificationKpis = useApi
  ? api.fetchPrefeituraNotificationKpis
  : mock.fetchPrefeituraNotificationKpis

export const fetchPrefeituraNotifications = useApi
  ? api.fetchPrefeituraNotifications
  : mock.fetchPrefeituraNotifications

export const fetchPrefeituraBroadcastUbtCatalog = useApi
  ? api.fetchPrefeituraBroadcastUbtCatalog
  : mock.fetchPrefeituraBroadcastUbtCatalog

export const fetchPrefeituraProfissionaisCatalog = useApi
  ? api.fetchPrefeituraProfissionaisCatalog
  : mock.fetchPrefeituraProfissionaisCatalog

export const createPrefeituraBroadcast = useApi
  ? api.createPrefeituraBroadcast
  : mock.createPrefeituraBroadcast

export const markPrefeituraNotificationRead = useApi
  ? api.markPrefeituraNotificationRead
  : mock.markPrefeituraNotificationRead

export const markAllPrefeituraNotificationsRead = useApi
  ? api.markAllPrefeituraNotificationsRead
  : mock.markAllPrefeituraNotificationsRead
