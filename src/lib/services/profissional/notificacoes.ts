import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/notificacoes'
import * as mock from '../../mockServices/profissional/notificacoes'

const useApi = isBackendApiEnabled()

export type {
  ProfissionalNotificationKpisResponse,
  ProfissionalNotificationListResponse,
} from '../../mockServices/profissional/notificacoes'

export const ProfissionalNotificacoesApiError = useApi
  ? api.ProfissionalNotificacoesApiError
  : mock.ProfissionalNotificacoesApiError

export const isProfissionalNotificacoesApiError = useApi
  ? api.isProfissionalNotificacoesApiError
  : mock.isProfissionalNotificacoesApiError

export const fetchProfissionalNotificationKpis = useApi
  ? api.fetchProfissionalNotificationKpis
  : mock.fetchProfissionalNotificationKpis

export const fetchProfissionalNotifications = useApi
  ? api.fetchProfissionalNotifications
  : mock.fetchProfissionalNotifications

export const markProfissionalNotificationRead = useApi
  ? api.markProfissionalNotificationRead
  : mock.markProfissionalNotificationRead

export const markAllProfissionalNotificationsRead = useApi
  ? api.markAllProfissionalNotificationsRead
  : mock.markAllProfissionalNotificationsRead
